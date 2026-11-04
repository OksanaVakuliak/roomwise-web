'use client';

import { useLocale } from 'next-intl';
import { useCallback, useRef, useState } from 'react';
import { buildSaveRequest } from '@/features/configurator/result/build-save-request';
import {
  errorCode,
  useWriteFailure,
} from '@/features/configurator/result/use-write-failure';
import { createActionKey } from '@/lib/api/idempotency';
import { type LeadBody, type LeadCreated, submitLead } from '@/lib/api/leads';
import { ApiRequestError } from '@/lib/api/request-error';
import { useRateLimitCountdown } from '@/lib/api/use-rate-limit-countdown';
import { createWriteGate } from '@/lib/api/write';
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
  | { kind: 'failed'; reason: LeadFailureReason; revision: number | null }
  | { kind: 'sent'; created: LeadCreated; revision: number | null };

type Reference = Pick<LeadBody, 'calculation' | 'draft'>;

type Resolved =
  | { ok: true; reference: Reference; hash: string | null }
  | { ok: false; state: LeadState };

export function useSubmitLead(target: LeadTarget) {
  const { kind } = target;
  const publicId = target.kind === 'snapshot' ? target.publicId : null;
  const versionNumber =
    target.kind === 'snapshot' ? target.versionNumber : null;
  const revision = useDraft((state) => state.revision);
  const locale = useLocale() as LeadBody['locale'];
  const setLastSaved = useDraft((state) => state.setLastSaved);
  const [gate] = useState(createWriteGate);
  const actionKey = useRef(createActionKey());
  const busy = useRef(false);
  const [state, setState] = useState<LeadState>({ kind: 'idle' });
  const limited = state.kind === 'limited';

  useRateLimitCountdown(gate, limited, setState);

  const currentRevision = useCallback(
    (): number | null =>
      kind === 'draft' ? useDraft.getState().revision : null,
    [kind],
  );

  const resolve = useCallback(async (): Promise<Resolved> => {
    if (publicId !== null && versionNumber !== null) {
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
        state: {
          kind: 'failed',
          reason: pricing ? 'incomplete' : 'generic',
          revision: useDraft.getState().revision,
        },
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
  }, [publicId, versionNumber]);

  const mapSharedFailure = useWriteFailure<number | null>(
    actionKey,
    currentRevision,
  );

  const fail = useCallback(
    (error: unknown, revision: number | null): LeadState => {
      switch (errorCode(error)) {
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
          return { kind: 'failed', reason: 'generic', revision };
        }
        case 'PHONE_INVALID':
          return { kind: 'invalid', errors: { phone: true } };
        case 'CALCULATION_NOT_FOUND':
          actionKey.current = createActionKey();
          if (kind === 'draft') {
            setLastSaved(null);
            return { kind: 'failed', reason: 'resave', revision };
          }
          return { kind: 'failed', reason: 'notFound', revision };
        default:
          return mapSharedFailure(error, revision);
      }
    },
    [mapSharedFailure, setLastSaved, kind],
  );

  const submit = useCallback(
    async (input: LeadInput) => {
      if (busy.current) {
        return;
      }
      busy.current = true;
      setState({ kind: 'pending' });
      let requestRevision = currentRevision();
      try {
        const resolved = await resolve();
        requestRevision = currentRevision();
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
        setState({ kind: 'sent', created, revision: requestRevision });
      } catch (error) {
        setState(fail(error, requestRevision));
      } finally {
        busy.current = false;
      }
    },
    [gate, locale, resolve, fail, setLastSaved, currentRevision],
  );

  const current =
    (state.kind === 'sent' || state.kind === 'failed') &&
    state.revision !== null &&
    state.revision !== revision
      ? { kind: 'idle' as const }
      : state;

  return { state: current, submit };
}
