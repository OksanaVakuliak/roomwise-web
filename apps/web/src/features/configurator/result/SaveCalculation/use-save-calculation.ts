'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { type SavedCalculation, saveCalculation } from '@/lib/api/calculations';
import { catalogRoots, useLang } from '@/lib/api/catalog';
import { createActionKey } from '@/lib/api/idempotency';
import { ApiRequestError } from '@/lib/api/request-error';
import { createWriteGate, RateLimitedError } from '@/lib/api/write';
import { captureException, captureMessage } from '@/lib/monitoring/client';
import { pickDraft, useDraft } from '@/stores/draft';
import { checkPricingData, usePricingData } from '@/stores/pricing-data';
import { buildSaveRequest } from '../build-save-request';

export type FailureReason =
  | 'incomplete'
  | 'outOfBounds'
  | 'unknownReference'
  | 'styleMissing'
  | 'validation'
  | 'generic';

export type SaveState =
  | { kind: 'idle' }
  | { kind: 'pending' }
  | { kind: 'limited'; seconds: number }
  | { kind: 'failed'; reason: FailureReason; revision: number }
  | {
      kind: 'saved';
      saved: SavedCalculation;
      diffCents: number | null;
      revision: number;
    };

const SECOND_MS = 1000;

export function useSaveCalculation(
  onSaved: (
    totals: SavedCalculation['version']['totals'],
    revision: number,
  ) => void,
) {
  const lang = useLang();
  const queryClient = useQueryClient();
  const revision = useDraft((state) => state.revision);
  const setLastSaved = useDraft((state) => state.setLastSaved);
  const clearStyle = useDraft((state) => state.clearStyle);
  const [gate] = useState(createWriteGate);
  const actionKey = useRef(createActionKey());
  const busy = useRef(false);
  const [state, setState] = useState<SaveState>({ kind: 'idle' });
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

  const fail = useCallback(
    (error: unknown, revision: number): SaveState => {
      if (error instanceof RateLimitedError) {
        return { kind: 'limited', seconds: error.retryAfterSeconds };
      }
      const code =
        error instanceof ApiRequestError ? error.apiError.code : null;
      switch (code) {
        case 'VALIDATION_FAILED':
          captureException(error);
          return { kind: 'failed', reason: 'validation', revision };
        case 'INPUT_OUT_OF_BOUNDS':
          void checkPricingData();
          return { kind: 'failed', reason: 'outOfBounds', revision };
        case 'UNKNOWN_REFERENCE':
          void checkPricingData();
          refreshCatalog();
          return { kind: 'failed', reason: 'unknownReference', revision };
        case 'STYLE_NOT_FOUND':
          clearStyle();
          return { kind: 'failed', reason: 'styleMissing', revision };
        case 'IDEMPOTENCY_KEY_REUSED':
        case 'IDEMPOTENCY_KEY_REQUIRED':
          actionKey.current = createActionKey();
          captureException(error);
          return { kind: 'failed', reason: 'generic', revision };
        case 'network':
          return { kind: 'failed', reason: 'generic', revision };
        default:
          captureException(error);
          return { kind: 'failed', reason: 'generic', revision };
      }
    },
    [clearStyle, refreshCatalog],
  );

  const save = useCallback(async () => {
    if (busy.current) {
      return;
    }
    busy.current = true;
    setState({ kind: 'pending' });
    let requestRevision = useDraft.getState().revision;
    try {
      await checkPricingData();
      const latest = useDraft.getState();
      requestRevision = latest.revision;
      const { data: pricing } = usePricingData.getState();
      const request = pricing
        ? buildSaveRequest(pickDraft(latest), pricing)
        : null;
      if (request === null) {
        setState({
          kind: 'failed',
          reason: pricing ? 'incomplete' : 'generic',
          revision: requestRevision,
        });
        return;
      }
      const { body, hash } = request;
      const saved = await saveCalculation(gate, {
        body,
        lang,
        idempotencyKey: actionKey.current.keyFor(body),
      });
      const { version, priceDifference } = saved;
      let diffCents: number | null = null;
      if (priceDifference) {
        diffCents =
          priceDifference.diffCents === 0 ? null : priceDifference.diffCents;
        void checkPricingData();
      } else if (version.totals.usdCents !== body.clientTotalUsdCents) {
        diffCents = version.totals.usdCents - body.clientTotalUsdCents;
        captureMessage('estimate-discrepancy', {
          level: 'error',
          fingerprint: ['estimate-discrepancy'],
          tags: {
            pricingVersion: body.clientPricingVersion,
            clientTotalUsdCents: body.clientTotalUsdCents,
            serverTotalUsdCents: version.totals.usdCents,
            diffCents,
          },
        });
      }
      setLastSaved({
        publicId: version.publicId,
        versionNumber: version.number,
        configurationHash: hash,
      });
      onSaved(version.totals, requestRevision);
      setState({ kind: 'saved', saved, diffCents, revision: requestRevision });
    } catch (error) {
      setState(fail(error, requestRevision));
    } finally {
      busy.current = false;
    }
  }, [gate, lang, onSaved, setLastSaved, fail]);

  const current =
    (state.kind === 'saved' || state.kind === 'failed') &&
    state.revision !== revision
      ? { kind: 'idle' as const }
      : state;

  return { state: current, save };
}
