import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  breakStorage,
  resetThemeDom,
  stubMatchMedia,
} from '@/lib/theme/test-utils';

async function load() {
  vi.resetModules();
  const { usePreferences } = await import('./preferences');
  const { usePreferencesHydration } = await import(
    './use-preferences-hydration'
  );
  return { usePreferences, usePreferencesHydration };
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  resetThemeDom();
});

describe('usePreferencesHydration', () => {
  it('keeps in-memory values when storage is blocked and the hook mounts twice', async () => {
    stubMatchMedia(false);
    breakStorage('getItem');
    breakStorage('setItem');
    const { usePreferences, usePreferencesHydration } = await load();

    usePreferences.getState().setCurrency('UAH');
    const first = renderHook(() => usePreferencesHydration());
    await waitFor(() => expect(first.result.current).toBe(true));
    const second = renderHook(() => usePreferencesHydration());
    await waitFor(() => expect(second.result.current).toBe(true));

    expect(usePreferences.getState().currency).toBe('UAH');
  });

  it('applies the stored theme when the init script did not run', async () => {
    stubMatchMedia(true);
    const { usePreferencesHydration } = await load();

    const { result } = renderHook(() => usePreferencesHydration());
    await waitFor(() => expect(result.current).toBe(true));

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('rehydrates once for several hook instances', async () => {
    stubMatchMedia(false);
    const { usePreferences, usePreferencesHydration } = await load();
    const rehydrate = vi.spyOn(usePreferences.persist, 'rehydrate');

    const first = renderHook(() => usePreferencesHydration());
    const second = renderHook(() => usePreferencesHydration());
    await waitFor(() => {
      expect(first.result.current).toBe(true);
      expect(second.result.current).toBe(true);
    });

    expect(rehydrate).toHaveBeenCalledTimes(1);
  });
});
