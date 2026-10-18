import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetThemeDom, stubMatchMedia } from '@/lib/theme/test-utils';

async function load() {
  vi.resetModules();
  const { useSystemThemeWatcher } = await import('./use-system-theme-watcher');
  return { useSystemThemeWatcher };
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  resetThemeDom();
});

describe('useSystemThemeWatcher', () => {
  it('follows system theme changes while the mode is system and cleans up', async () => {
    const media = stubMatchMedia(false);
    const { useSystemThemeWatcher } = await load();

    const { unmount } = renderHook(() => useSystemThemeWatcher());
    expect(media.listenerCount()).toBe(1);
    media.setDark(true);

    expect(document.documentElement.dataset.theme).toBe('dark');
    unmount();
    expect(media.listenerCount()).toBe(0);
  });
});
