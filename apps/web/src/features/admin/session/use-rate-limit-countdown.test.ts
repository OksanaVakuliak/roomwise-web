import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useRateLimitCountdown } from './use-rate-limit-countdown';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useRateLimitCountdown', () => {
  it('is zero without a limit', () => {
    const { result } = renderHook(() => useRateLimitCountdown(0));
    expect(result.current).toBe(0);
  });

  it('counts down to zero and stops', () => {
    const { result } = renderHook(() => useRateLimitCountdown(3));
    expect(result.current).toBe(3);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current).toBe(2);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('restarts when a new limit arrives after the previous one', () => {
    const { result, rerender } = renderHook(
      ({ seconds }) => useRateLimitCountdown(seconds),
      { initialProps: { seconds: 2 } },
    );
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current).toBe(0);
    rerender({ seconds: 0 });
    rerender({ seconds: 2 });
    expect(result.current).toBe(2);
  });

  it('stops ticking after unmount', () => {
    const { unmount } = renderHook(() => useRateLimitCountdown(5));
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
