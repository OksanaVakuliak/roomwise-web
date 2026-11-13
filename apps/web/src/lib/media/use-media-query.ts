'use client';

import { useCallback, useSyncExternalStore } from 'react';

const DESKTOP_QUERY = '(min-width: 768px)';
const WIDE_QUERY = '(min-width: 1024px)';

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (notify: () => void) => {
      if (typeof window.matchMedia !== 'function') {
        return () => undefined;
      }
      const list = window.matchMedia(query);
      list.addEventListener('change', notify);
      return () => list.removeEventListener('change', notify);
    },
    [query],
  );
  const read = useCallback(
    () =>
      typeof window.matchMedia === 'function' &&
      window.matchMedia(query).matches,
    [query],
  );

  return useSyncExternalStore(subscribe, read, () => false);
}

export function useIsDesktop(): boolean {
  return useMediaQuery(DESKTOP_QUERY);
}

export function useIsWide(): boolean {
  return useMediaQuery(WIDE_QUERY);
}
