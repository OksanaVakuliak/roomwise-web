import { QueryClient } from '@tanstack/react-query';
import { shouldRetry } from './retry';

export const QUERY_STALE_TIME_MS = 30_000;

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: QUERY_STALE_TIME_MS, retry: shouldRetry },
    },
  });
}
