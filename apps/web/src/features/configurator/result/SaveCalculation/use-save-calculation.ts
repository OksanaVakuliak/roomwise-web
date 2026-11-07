'use client';

import { useCallback, useRef, useState } from 'react';
import { type SavedCalculation, saveCalculation } from '@/lib/api/calculations';
import { useLang } from '@/lib/api/catalog';
import { createActionKey } from '@/lib/api/idempotency';
import { useRateLimitCountdown } from '@/lib/api/use-rate-limit-countdown';
import { createWriteGate } from '@/lib/api/write';
import { captureException, captureMessage } from '@/lib/monitoring/client';
import { pickDraft, useDraft } from '@/stores/draft';
import { checkPricingData, usePricingData } from '@/stores/pricing-data';
import { buildSaveRequest } from '../build-save-request';
import { errorCode, useWriteFailure } from '../use-write-failure';

export type FailureReason =
  | 'incomplete'
  | 'outOfBounds'
  | 'unknownReference'
  | 'styleMissing'
  | 'emptyEstimate'
  | 'validation'
  | 'generic';

export type SaveState =
  | { kind: 'idle' }
  | { kind: 'pending' }
  | { kind: 'limited'; seconds: number }
  | { kind: 'failed'; reason: FailureReason; revision: number }
  | {
      kind: 'saved';
      publicId: string;
      versionNumber: number;
      diffCents: number | null;
      revision: number;
    };

export function useSaveCalculation(
  onSaved: (
    totals: SavedCalculation['version']['totals'],
    revision: number,
  ) => void,
) {
  const lang = useLang();
  const revision = useDraft((state) => state.revision);
  const setLastSaved = useDraft((state) => state.setLastSaved);
  const [gate] = useState(createWriteGate);
  const actionKey = useRef(createActionKey());
  const busy = useRef(false);
  const [state, setState] = useState<SaveState>({ kind: 'idle' });
  const limited = state.kind === 'limited';

  useRateLimitCountdown(gate, limited, setState);

  const mapSharedFailure = useWriteFailure<number>(actionKey);

  const fail = useCallback(
    (error: unknown, revision: number): SaveState => {
      if (errorCode(error) === 'VALIDATION_FAILED') {
        captureException(error);
        return { kind: 'failed', reason: 'validation', revision };
      }
      return mapSharedFailure(error, revision);
    },
    [mapSharedFailure],
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
      const { lastSaved } = useDraft.getState();
      if (lastSaved?.configurationHash === hash) {
        setState({
          kind: 'saved',
          publicId: lastSaved.publicId,
          versionNumber: lastSaved.versionNumber,
          diffCents: null,
          revision: requestRevision,
        });
        return;
      }
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
      setState({
        kind: 'saved',
        publicId: version.publicId,
        versionNumber: version.number,
        diffCents,
        revision: requestRevision,
      });
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
