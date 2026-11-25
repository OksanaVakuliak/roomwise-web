import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useUserActive } from './use-user-active';

const IDLE_MS = 1000;

describe('useUserActive', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('turns inactive after the idle time without input', () => {
    const { result } = renderHook(() => useUserActive(IDLE_MS));
    expect(result.current).toBe(true);

    act(() => {
      vi.advanceTimersByTime(IDLE_MS);
    });
    expect(result.current).toBe(false);
  });

  it('turns active again on input and restarts the idle time', () => {
    const { result } = renderHook(() => useUserActive(IDLE_MS));
    act(() => {
      vi.advanceTimersByTime(IDLE_MS);
    });

    act(() => {
      window.dispatchEvent(new Event('keydown'));
    });
    expect(result.current).toBe(true);

    act(() => {
      vi.advanceTimersByTime(IDLE_MS - 1);
    });
    expect(result.current).toBe(true);
  });
});
