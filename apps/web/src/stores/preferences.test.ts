import { beforeEach, describe, expect, it, vi } from 'vitest';
import { THEME_STORAGE_KEY } from '@/lib/theme';
import {
  breakStorage,
  resetThemeDom,
  stubMatchMedia,
} from '@/lib/theme/test-utils';
import { PREFERENCES_STORAGE_KEY, usePreferences } from './preferences';

const stored = () => {
  const raw = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);
  return raw === null ? null : JSON.parse(raw);
};

const seed = (value: unknown) =>
  window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(value));

beforeEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  resetThemeDom();
  stubMatchMedia(false);
  usePreferences.setState({ locale: 'en', currency: 'USD', theme: 'system' });
});

describe('usePreferences', () => {
  it('starts with defaults', () => {
    const { locale, currency, theme } = usePreferences.getState();
    expect({ locale, currency, theme }).toEqual({
      locale: 'en',
      currency: 'USD',
      theme: 'system',
    });
  });

  it('persists only locale and currency', () => {
    usePreferences.getState().setLocale('uk');
    usePreferences.getState().setCurrency('UAH');
    usePreferences.getState().setTheme('dark');

    expect(stored()).toEqual({
      state: { locale: 'uk', currency: 'UAH' },
      version: 1,
    });
  });

  it('restores persisted values on rehydrate', async () => {
    seed({ state: { locale: 'uk', currency: 'UAH' }, version: 1 });

    await usePreferences.persist.rehydrate();

    expect(usePreferences.getState().locale).toBe('uk');
    expect(usePreferences.getState().currency).toBe('UAH');
    expect(usePreferences.persist.hasHydrated()).toBe(true);
  });

  it('falls back to defaults for invalid JSON', async () => {
    window.localStorage.setItem(PREFERENCES_STORAGE_KEY, '{broken');

    await usePreferences.persist.rehydrate();

    expect(usePreferences.getState().locale).toBe('en');
    expect(usePreferences.getState().currency).toBe('USD');
    expect(usePreferences.persist.hasHydrated()).toBe(true);
  });

  it('falls back per field for invalid values', async () => {
    seed({ state: { locale: 'fr', currency: 'UAH' }, version: 1 });

    await usePreferences.persist.rehydrate();

    expect(usePreferences.getState().locale).toBe('en');
    expect(usePreferences.getState().currency).toBe('UAH');
  });

  it('falls back to defaults for an invalid shape', async () => {
    seed({ state: 'oops', version: 1 });

    await usePreferences.persist.rehydrate();

    expect(usePreferences.getState().locale).toBe('en');
    expect(usePreferences.getState().currency).toBe('USD');
  });

  it('resets on an old version', async () => {
    seed({ state: { locale: 'uk', currency: 'UAH' }, version: 0 });

    await usePreferences.persist.rehydrate();

    expect(usePreferences.getState().locale).toBe('en');
    expect(usePreferences.getState().currency).toBe('USD');
    expect(stored().version).toBe(1);
  });

  it('does not throw when storage throws', async () => {
    breakStorage('getItem');
    breakStorage('setItem');

    await expect(usePreferences.persist.rehydrate()).resolves.not.toThrow();
    expect(() => usePreferences.getState().setLocale('uk')).not.toThrow();
    expect(usePreferences.getState().locale).toBe('uk');
  });

  it('works without localStorage', async () => {
    vi.stubGlobal('localStorage', undefined);

    await expect(usePreferences.persist.rehydrate()).resolves.not.toThrow();
    expect(() => usePreferences.getState().setCurrency('UAH')).not.toThrow();
  });

  it('writes the theme key and applies the theme', () => {
    usePreferences.getState().setTheme('dark');

    expect(usePreferences.getState().theme).toBe('dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});
