'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { type SavedCalculation, saveCalculation } from '@/lib/api/calculations';
import { catalogKeys, useLang } from '@/lib/api/catalog';
import { createActionKey } from '@/lib/api/idempotency';
import { ApiRequestError } from '@/lib/api/request-error';
import { createWriteGate, RateLimitedError } from '@/lib/api/write';
import { captureException, captureMessage } from '@/lib/monitoring/client';
import { useDraft, useDraftValue } from '@/stores/draft';
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
  | { kind: 'failed'; reason: FailureReason }
  | {
      kind: 'saved';
      saved: SavedCalculation;
      diffCents: number | null;
      revision: number;
    };

const SECOND_MS = 1000;

export function useSaveCalculation(
  onSaved: (totals: SavedCalculation['version']['totals']) => void,
) {
  const lang = useLang();
  const queryClient = useQueryClient();
  const draft = useDraftValue();
  const revision = useDraft((state) => state.revision);
  const setLastSaved = useDraft((state) => state.setLastSaved);
  const clearStyle = useDraft((state) => state.clearStyle);
  const [gate] = useState(createWriteGate);
  const actionKey = useRef(createActionKey());
  const busy = useRef(false);
  const [state, setState] = useState<SaveState>({ kind: 'idle' });
  const limitedSeconds = state.kind === 'limited' ? state.seconds : 0;

  useEffect(() => {
    if (limitedSeconds === 0) {
      return;
    }
    const timer = setTimeout(() => {
      const seconds = gate.blockedForSeconds();
      setState(seconds > 0 ? { kind: 'limited', seconds } : { kind: 'idle' });
    }, SECOND_MS);
    return () => clearTimeout(timer);
  }, [limitedSeconds, gate]);

  const refreshCatalog = useCallback(() => {
    const { styleId } = useDraft.getState();
    void queryClient.invalidateQueries({ queryKey: catalogKeys.styles(lang) });
    void queryClient.invalidateQueries({
      queryKey: catalogKeys.roomTypes(lang),
    });
    if (styleId !== null) {
      void queryClient.invalidateQueries({
        queryKey: catalogKeys.defaultMaterials(styleId),
      });
    }
  }, [queryClient, lang]);

  const fail = useCallback(
    (error: unknown): SaveState => {
      if (error instanceof RateLimitedError) {
        return { kind: 'limited', seconds: error.retryAfterSeconds };
      }
      const code =
        error instanceof ApiRequestError ? error.apiError.code : null;
      switch (code) {
        case 'VALIDATION_FAILED':
          captureException(error);
          return { kind: 'failed', reason: 'validation' };
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
    [clearStyle, refreshCatalog],
  );

  const save = useCallback(async () => {
    if (busy.current) {
      return;
    }
    busy.current = true;
    setState({ kind: 'pending' });
    try {
      await checkPricingData();
      const { data: pricing } = usePricingData.getState();
      const request = pricing ? buildSaveRequest(draft, pricing) : null;
      if (request === null) {
        setState({
          kind: 'failed',
          reason: pricing ? 'incomplete' : 'generic',
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
      let diffCents = priceDifference?.diffCents ?? null;
      if (priceDifference) {
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
      onSaved(version.totals);
      setState({ kind: 'saved', saved, diffCents, revision });
    } catch (error) {
      setState(fail(error));
    } finally {
      busy.current = false;
    }
  }, [draft, revision, gate, lang, onSaved, setLastSaved, fail]);

  const current =
    state.kind === 'saved' && state.revision !== revision
      ? { kind: 'idle' as const }
      : state;

  return { state: current, save };
}
