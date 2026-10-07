'use client';

import { useEffect, useState } from 'react';
import { readThemeMode } from '@/lib/theme';
import { usePreferences } from './preferences';

export function usePreferencesHydration(): boolean {
  const [hydrated, setHydrated] = useState(() =>
    usePreferences.persist.hasHydrated(),
  );

  useEffect(() => {
    let active = true;
    Promise.resolve(usePreferences.persist.rehydrate()).then(() => {
      usePreferences.setState({ theme: readThemeMode() });
      if (active) {
        setHydrated(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return hydrated;
}
