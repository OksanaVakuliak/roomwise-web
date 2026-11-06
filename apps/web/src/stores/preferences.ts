import type { Locale } from 'next-intl';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { routing } from '@/i18n/routing';
import { type Currency, currencies } from '@/lib/format';
import { applyTheme, type ThemeMode, writeThemeMode } from '@/lib/theme';
import { createSafeStorage } from './safe-storage';

export const PREFERENCES_STORAGE_KEY = 'roomwise-preferences';
const PREFERENCES_VERSION = 1;

type PersistedPreferences = { locale: Locale; currency: Currency };

type PreferencesState = PersistedPreferences & {
  theme: ThemeMode;
  setLocale: (locale: Locale) => void;
  setCurrency: (currency: Currency) => void;
  setTheme: (theme: ThemeMode) => void;
};

const DEFAULTS: PersistedPreferences & { theme: ThemeMode } = {
  locale: 'en',
  currency: 'USD',
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
  };
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setLocale: (locale) => set({ locale }),
      setCurrency: (currency) => set({ currency }),
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
      migrate: () => sanitize(undefined),
      merge: (persisted, current) =>
        persisted == null
          ? current
          : { ...current, ...sanitize(persisted, current) },
      partialize: ({ locale, currency }) => ({ locale, currency }),
      skipHydration: true,
    },
  ),
);
