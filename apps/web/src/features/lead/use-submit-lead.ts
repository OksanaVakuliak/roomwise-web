'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { buildSaveRequest } from '@/features/configurator/result/build-save-request';
import { catalogRoots } from '@/lib/api/catalog';
import { createActionKey } from '@/lib/api/idempotency';
import { type LeadBody, type LeadCreated, submitLead } from '@/lib/api/leads';
import { ApiRequestError } from '@/lib/api/request-error';
import { createWriteGate, RateLimitedError } from '@/lib/api/write';
import { captureException } from '@/lib/monitoring/client';
import { pickDraft, useDraft } from '@/stores/draft';
import { checkPricingData, usePricingData } from '@/stores/pricing-data';
import {
  type LeadFieldErrors,
  type LeadInput,
  serverFieldErrors,
} from './lead-fields';

export type LeadTarget =
  | { kind: 'draft' }
  | { kind: 'snapshot'; publicId: string; versionNumber: number };

export type LeadFailureReason =
  | 'incomplete'
  | 'outOfBounds'
  | 'unknownReference'
  | 'styleMissing'
  | 'resave'
  | 'notFound'
  | 'generic';

export type LeadState =
  | { kind: 'idle' }
  | { kind: 'pending' }
  | { kind: 'limited'; seconds: number }
  | { kind: 'invalid'; errors: LeadFieldErrors }
  | { kind: 'failed'; reason: LeadFailureReason }
  | { kind: 'sent'; created: LeadCreated };

type Reference = Pick<LeadBody, 'calculation' | 'draft'>;

type Resolved =
  | { ok: true; reference: Reference; hash: string | null }
  | { ok: false; state: LeadState };

const SECOND_MS = 1000;

export function useSubmitLead(target: LeadTarget) {
  const locale = useLocale() as LeadBody['locale'];
  const queryClient = useQueryClient();
  const setLastSaved = useDraft((state) => state.setLastSaved);
  const clearStyle = useDraft((state) => state.clearStyle);
  const [gate] = useState(createWriteGate);
  const actionKey = useRef(createActionKey());
  const busy = useRef(false);
  const [state, setState] = useState<LeadState>({ kind: 'idle' });
  const limited = state.kind === 'limited';

  useEffect(() => {
    if (!limited) {
      return;
    }
    const timer = setInterval(() => {
      const seconds = gate.blockedForSeconds();
      setState(seconds > 0 ? { kind: 'limited', seconds } : { kind: 'idle' });
    }, SECOND_MS);
    return () => clearInterval(timer);
  }, [limited, gate]);

  const refreshCatalog = useCallback(() => {
    for (const root of Object.values(catalogRoots)) {
      void queryClient.invalidateQueries({ queryKey: [root] });
    }
  }, [queryClient]);

  const resolve = useCallback(async (): Promise<Resolved> => {
    if (target.kind === 'snapshot') {
      const { publicId, versionNumber } = target;
      return {
        ok: true,
        reference: { calculation: { publicId, versionNumber } },
        hash: null,
      };
    }
    await checkPricingData();
    const { data: pricing } = usePricingData.getState();
    const request = pricing
      ? buildSaveRequest(pickDraft(useDraft.getState()), pricing)
      : null;
    if (request === null) {
      return {
        ok: false,
        state: { kind: 'failed', reason: pricing ? 'incomplete' : 'generic' },
      };
    }
    const { body, hash } = request;
    const { lastSaved } = useDraft.getState();
    if (lastSaved !== null && lastSaved.configurationHash === hash) {
      const { publicId, versionNumber } = lastSaved;
      return {
        ok: true,
        reference: { calculation: { publicId, versionNumber } },
        hash,
      };
    }
    return { ok: true, reference: { draft: body }, hash };
  }, [target]);

  const fail = useCallback(
    (error: unknown): LeadState => {
      if (error instanceof RateLimitedError) {
        return { kind: 'limited', seconds: error.retryAfterSeconds };
      }
      const code =
        error instanceof ApiRequestError ? error.apiError.code : null;
      switch (code) {
        case 'VALIDATION_FAILED': {
          const errors = serverFieldErrors(
            error instanceof ApiRequestError
              ? (error.apiError.fields ?? [])
              : [],
          );
          if (Object.keys(errors).length > 0) {
            return { kind: 'invalid', errors };
          }
          captureException(error);
          return { kind: 'failed', reason: 'generic' };
        }
        case 'PHONE_INVALID':
          return { kind: 'invalid', errors: { phone: true } };
        case 'INPUT_OUT_OF_BOUNDS':
          void checkPricingData();
          return { kind: 'failed', reason: 'outOfBounds' };
        case 'UNKNOWN_REFERENCE':
          void checkPricingData();
          refreshCatalog();
          return { kind: 'failed', reason: 'unknownReference' };
        case 'STYLE_NOT_FOUND':
          clearStyle();
          return { kind: 'failed', reason: 'styleMissing' };
        case 'CALCULATION_NOT_FOUND':
          actionKey.current = createActionKey();
          if (target.kind === 'draft') {
            setLastSaved(null);
            return { kind: 'failed', reason: 'resave' };
          }
          return { kind: 'failed', reason: 'notFound' };
        case 'IDEMPOTENCY_KEY_REUSED':
        case 'IDEMPOTENCY_KEY_REQUIRED':
          actionKey.current = createActionKey();
          captureException(error);
          return { kind: 'failed', reason: 'generic' };
        case 'network':
          return { kind: 'failed', reason: 'generic' };
        default:
          captureException(error);
          return { kind: 'failed', reason: 'generic' };
      }
    },
    [clearStyle, refreshCatalog, setLastSaved, target.kind],
  );

  const submit = useCallback(
    async (input: LeadInput) => {
      if (busy.current) {
        return;
      }
      busy.current = true;
      setState({ kind: 'pending' });
      try {
        const resolved = await resolve();
        if (!resolved.ok) {
          setState(resolved.state);
          return;
        }
        const { reference, hash } = resolved;
        const email = input.email.trim();
        const comment = input.comment.trim();
        const body: LeadBody = {
          ...reference,
          name: input.name.trim(),
          phone: input.phone.trim(),
          ...(email === '' ? {} : { email }),
          ...(comment === '' ? {} : { comment }),
          consent: { accepted: true, text: input.consentText },
          locale,
          website: input.website,
        };
        const created = await submitLead(gate, {
          body,
          idempotencyKey: actionKey.current.keyFor(body),
        });
        if (reference.draft && hash !== null) {
          setLastSaved({
            publicId: created.calculation.publicId,
            versionNumber: created.calculation.versionNumber,
            configurationHash: hash,
          });
        }
        if (created.priceDifference) {
          void checkPricingData();
        }
        setState({ kind: 'sent', created });
      } catch (error) {
        setState(fail(error));
      } finally {
        busy.current = false;
      }
    },
    [gate, locale, resolve, fail, setLastSaved],
  );

  return { state, submit };
}
