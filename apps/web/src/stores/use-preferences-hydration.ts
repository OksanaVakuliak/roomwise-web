'use client';

import { useEffect, useState } from 'react';
import { readThemeMode, watchSystemTheme } from '@/lib/theme';
import { usePreferences } from './preferences';

let hydration: Promise<void> | undefined;

function hydrateOnce(): Promise<void> {
  hydration ??= Promise.resolve(usePreferences.persist.rehydrate()).then(() => {
    usePreferences.setState({ theme: readThemeMode() });
  });
  return hydration;
}

export function usePreferencesHydration(): boolean {
  const [hydrated, setHydrated] = useState(() =>
    usePreferences.persist.hasHydrated(),
  );

  useEffect(() => {
    let active = true;
    hydrateOnce().then(() => {
      if (active) {
        setHydrated(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(
    () =>
      watchSystemTheme(
        () => usePreferences.getState().theme,
        () => {},
      ),
    [],
  );

  return hydrated;
}
