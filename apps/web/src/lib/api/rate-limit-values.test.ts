import { describe, expect, it } from 'vitest';
import { rateLimitValues } from './use-rate-limit-countdown';

describe('rateLimitValues', () => {
  it('keeps seconds below a minute', () => {
    expect(rateLimitValues(59)).toEqual({ seconds: 59, minutes: 0 });
  });

  it('rounds minutes up from 60 seconds', () => {
    expect(rateLimitValues(60).minutes).toBe(1);
    expect(rateLimitValues(61).minutes).toBe(2);
    expect(rateLimitValues(3577).minutes).toBe(60);
  });
});
