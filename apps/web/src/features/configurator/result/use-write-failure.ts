import { type RefObject, useCallback } from 'react';
import { useRefreshCatalog } from '@/lib/api/catalog';
import { type ActionKey, createActionKey } from '@/lib/api/idempotency';
import { ApiRequestError } from '@/lib/api/request-error';
import { RateLimitedError } from '@/lib/api/write';
import { captureException } from '@/lib/monitoring/client';
import { useDraft } from '@/stores/draft';
import { checkPricingData } from '@/stores/pricing-data';

export type SharedFailureReason =
  | 'outOfBounds'
  | 'unknownReference'
  | 'styleMissing'
  | 'generic';

export type SharedWriteFailure<Revision extends number | null> =
  | { kind: 'limited'; seconds: number }
  | { kind: 'failed'; reason: SharedFailureReason; revision: Revision };

export function errorCode(error: unknown) {
  return error instanceof ApiRequestError ? error.apiError.code : null;
}

export function useWriteFailure<Revision extends number | null>(
  actionKey: RefObject<ActionKey>,
  readRevision?: () => Revision,
) {
  const refreshCatalog = useRefreshCatalog();
  const clearStyle = useDraft((state) => state.clearStyle);

  return useCallback(
    (error: unknown, revision: Revision): SharedWriteFailure<Revision> => {
      if (error instanceof RateLimitedError) {
        return { kind: 'limited', seconds: error.retryAfterSeconds };
      }
      switch (errorCode(error)) {
        case 'INPUT_OUT_OF_BOUNDS':
          void checkPricingData();
          return { kind: 'failed', reason: 'outOfBounds', revision };
        case 'UNKNOWN_REFERENCE':
          void checkPricingData();
          refreshCatalog();
          return { kind: 'failed', reason: 'unknownReference', revision };
        case 'STYLE_NOT_FOUND':
          clearStyle();
          return {
            kind: 'failed',
            reason: 'styleMissing',
            revision: readRevision ? readRevision() : revision,
          };
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
    [actionKey, clearStyle, readRevision, refreshCatalog],
  );
}
