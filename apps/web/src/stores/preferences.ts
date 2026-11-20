import type { Locale } from 'next-intl';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { routing } from '@/i18n/routing';
import { type Currency, currencies } from '@/lib/format';
import { applyTheme, type ThemeMode, writeThemeMode } from '@/lib/theme';
import { createSafeStorage } from './safe-storage';

export const PREFERENCES_STORAGE_KEY = 'roomwise-preferences';
const PREFERENCES_VERSION = 2;

type PersistedPreferences = {
  locale: Locale;
  currency: Currency;
  scene3d: boolean;
};

type PreferencesState = PersistedPreferences & {
  theme: ThemeMode;
  setLocale: (locale: Locale) => void;
  setCurrency: (currency: Currency) => void;
  setScene3d: (scene3d: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
};

const DEFAULTS: PersistedPreferences & { theme: ThemeMode } = {
  locale: 'en',
  currency: 'USD',
  scene3d: true,
  theme: 'system',
};

function pick<T extends string>(
  allowed: readonly T[],
  value: unknown,
  fallback: T,
): T {
  return allowed.find((item) => item === value) ?? fallback;
}

function sanitize(
  persisted: unknown,
  fallback: PersistedPreferences = DEFAULTS,
): PersistedPreferences {
  const source =
    typeof persisted === 'object' && persisted !== null
      ? (persisted as Record<string, unknown>)
      : {};
  return {
    locale: pick(routing.locales, source.locale, fallback.locale),
    currency: pick(currencies, source.currency, fallback.currency),
    scene3d:
      typeof source.scene3d === 'boolean' ? source.scene3d : fallback.scene3d,
  };
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setLocale: (locale) => set({ locale }),
      setCurrency: (currency) => set({ currency }),
      setScene3d: (scene3d) => set({ scene3d }),
      setTheme: (theme) => {
        set({ theme });
        writeThemeMode(theme);
        applyTheme(theme);
      },
    }),
    {
      name: PREFERENCES_STORAGE_KEY,
      storage: createJSONStorage(() => createSafeStorage()),
      version: PREFERENCES_VERSION,
      migrate: (persisted, version) =>
        version === 1 ? sanitize(persisted) : sanitize(undefined),
      merge: (persisted, current) =>
        persisted == null
          ? current
          : { ...current, ...sanitize(persisted, current) },
      partialize: ({ locale, currency, scene3d }) => ({
        locale,
        currency,
        scene3d,
      }),
      skipHydration: true,
    },
  ),
);
