import { describe, expect, it } from 'vitest';
import { ApiRequestError } from '@/lib/api/request-error';
import { MAX_RETRIES, shouldRetry } from './retry';

describe('shouldRetry', () => {
  it('retries network failures', () => {
    expect(shouldRetry(0, new TypeError('Failed to fetch'))).toBe(true);
  });

  it('retries 5xx responses', () => {
    expect(shouldRetry(1, new ApiRequestError(503, undefined))).toBe(true);
  });

  it.each([400, 401, 404, 422, 429])('does not retry %i', (status) => {
    expect(shouldRetry(0, new ApiRequestError(status, undefined))).toBe(false);
  });

  it('stops after the maximum number of attempts', () => {
    expect(shouldRetry(MAX_RETRIES, new ApiRequestError(500, undefined))).toBe(
      false,
    );
    expect(shouldRetry(MAX_RETRIES, new TypeError('offline'))).toBe(false);
  });
});
