import { ApiRequestError } from '@/lib/api/request-error';

export const MAX_RETRIES = 3;

export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_RETRIES) {
    return false;
  }
  return !(error instanceof ApiRequestError) || error.status >= 500;
}
