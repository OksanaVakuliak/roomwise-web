'use client';

import { useEffect } from 'react';
import { watchSystemTheme } from '@/lib/theme';
import { usePreferences } from './preferences';

export function useSystemThemeWatcher(): void {
  useEffect(
    () =>
      watchSystemTheme(
        () => usePreferences.getState().theme,
        () => {},
      ),
    [],
  );
}
