import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { usePrefersReducedMotion } from './use-prefers-reduced-motion';

const original = window.matchMedia;

function stub(initial: boolean) {
  let matches = initial;
  const listeners = new Set<() => void>();
  const queries: string[] = [];
  window.matchMedia = ((query: string) => {
    queries.push(query);
    return {
      media: query,
      get matches() {
        return matches;
      },
      addEventListener: (_: string, listener: () => void) =>
        listeners.add(listener),
      removeEventListener: (_: string, listener: () => void) =>
        listeners.delete(listener),
    };
  }) as unknown as typeof window.matchMedia;
  return {
    queries,
    set(value: boolean) {
      matches = value;
      for (const listener of listeners) listener();
    },
  };
}

afterEach(() => {
  window.matchMedia = original;
});

describe('usePrefersReducedMotion', () => {
  it('queries prefers-reduced-motion', () => {
    const media = stub(true);

    const { result } = renderHook(() => usePrefersReducedMotion());

    expect(result.current).toBe(true);
    expect(media.queries).toContain('(prefers-reduced-motion: reduce)');
  });

  it('follows changes', () => {
    const media = stub(false);
    const { result } = renderHook(() => usePrefersReducedMotion());

    expect(result.current).toBe(false);
    act(() => media.set(true));

    expect(result.current).toBe(true);
  });

  it('is false without matchMedia', () => {
    window.matchMedia = undefined as unknown as typeof window.matchMedia;

    const { result } = renderHook(() => usePrefersReducedMotion());

    expect(result.current).toBe(false);
  });
});
