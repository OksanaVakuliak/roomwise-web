import type { ApiError } from './errors';

const GATEWAY_STATUSES: ReadonlySet<number> = new Set([502, 503, 504]);

export const isServerUnavailable = (
  status: number,
  apiError?: ApiError,
): boolean =>
  GATEWAY_STATUSES.has(status) ||
  (status === 500 && (apiError === undefined || apiError.code === 'unknown'));
