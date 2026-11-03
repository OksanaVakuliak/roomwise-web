'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  calculationKeys,
  recalculateCalculation,
  type VersionView,
} from '@/lib/api/calculations';
import { useLang } from '@/lib/api/catalog';
import { createActionKey } from '@/lib/api/idempotency';
import { ApiRequestError } from '@/lib/api/request-error';
import { createWriteGate, RateLimitedError } from '@/lib/api/write';
import { captureException } from '@/lib/monitoring/client';

const SECOND_MS = 1000;

export type RecalculateState =
  | { kind: 'idle' }
  | { kind: 'pending' }
  | { kind: 'limited'; seconds: number }
  | { kind: 'failed' };

export function useRecalculate(
  version: VersionView,
  onCreated: (created: VersionView) => void,
) {
  const lang = useLang();
  const queryClient = useQueryClient();
  const [gate] = useState(createWriteGate);
  const actionKey = useRef(createActionKey());
  const busy = useRef(false);
  const [state, setState] = useState<RecalculateState>({ kind: 'idle' });
  const { publicId, number } = version;
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

  const recalculate = useCallback(async () => {
    if (busy.current) {
      return;
    }
    busy.current = true;
    setState({ kind: 'pending' });
    try {
      const body = { basedOnVersion: number };
      const created = await recalculateCalculation(gate, publicId, {
        body,
        lang,
        idempotencyKey: actionKey.current.keyFor(body),
      });
      queryClient.setQueryData(
        calculationKeys.version(publicId, created.number, lang),
        created,
      );
      void queryClient.invalidateQueries({
        queryKey: calculationKeys.all(publicId),
      });
      setState({ kind: 'idle' });
      onCreated(created);
    } catch (error) {
      if (error instanceof RateLimitedError) {
        setState({ kind: 'limited', seconds: error.retryAfterSeconds });
      } else {
        const code =
          error instanceof ApiRequestError ? error.apiError.code : null;
        if (
          code === 'IDEMPOTENCY_KEY_REUSED' ||
          code === 'IDEMPOTENCY_KEY_REQUIRED'
        ) {
          actionKey.current = createActionKey();
        }
        if (code !== 'network') {
          captureException(error);
        }
        setState({ kind: 'failed' });
      }
    } finally {
      busy.current = false;
    }
  }, [gate, lang, number, publicId, queryClient, onCreated]);

  return { state, recalculate };
}
