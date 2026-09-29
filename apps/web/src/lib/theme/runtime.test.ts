import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { THEME_COLORS, THEME_STORAGE_KEY } from './constants';
import {
  applyTheme,
  readThemeMode,
  watchSystemTheme,
  writeThemeMode,
} from './runtime';
import { breakStorage, resetThemeDom, stubMatchMedia } from './test-utils';

const themeColor = () =>
  document.head.querySelector<HTMLMetaElement>('meta[name="theme-color"]');

beforeEach(() => {
  resetThemeDom();
  stubMatchMedia(false);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('readThemeMode', () => {
  it('returns the stored mode', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    expect(readThemeMode()).toBe('dark');
  });

  it('returns system when nothing is stored', () => {
    expect(readThemeMode()).toBe('system');
  });

  it('returns system for an invalid stored value', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'purple');
    expect(readThemeMode()).toBe('system');
  });

  it('returns system when storage throws', () => {
    breakStorage('getItem');
    expect(readThemeMode()).toBe('system');
  });
});

describe('writeThemeMode', () => {
  it('stores the mode', () => {
    writeThemeMode('light');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('does not throw when storage throws', () => {
    breakStorage('setItem');
    expect(() => writeThemeMode('dark')).not.toThrow();
  });
});

describe('applyTheme', () => {
  it('sets the attribute and creates the theme-color meta', () => {
    expect(applyTheme('dark')).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(themeColor()?.content).toBe(THEME_COLORS.dark);
  });

  it('updates an existing meta instead of adding another', () => {
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = '#000000';
    document.head.appendChild(meta);

    applyTheme('light');

    expect(
      document.head.querySelectorAll('meta[name="theme-color"]'),
    ).toHaveLength(1);
    expect(meta.content).toBe(THEME_COLORS.light);
  });

  it('follows the system preference in system mode', () => {
    stubMatchMedia(true);
    expect(applyTheme('system')).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('falls back to light in system mode when matchMedia is missing', () => {
    Reflect.deleteProperty(window, 'matchMedia');
    expect(applyTheme('system')).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(themeColor()?.content).toBe(THEME_COLORS.light);
  });

  it('ignores the system preference for an explicit mode', () => {
    stubMatchMedia(true);
    expect(applyTheme('light')).toBe('light');
  });
});

describe('watchSystemTheme', () => {
  it('returns a no-op unsubscribe when matchMedia is missing', () => {
    Reflect.deleteProperty(window, 'matchMedia');
    const unsubscribe = watchSystemTheme(() => 'system', vi.fn());
    expect(unsubscribe).not.toThrow();
  });

  it('applies and reports the new theme in system mode', () => {
    const media = stubMatchMedia(false);
    const onChange = vi.fn();
    watchSystemTheme(() => 'system', onChange);

    media.setDark(true);

    expect(onChange).toHaveBeenCalledWith('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(themeColor()?.content).toBe(THEME_COLORS.dark);
  });

  it.each(['light', 'dark'] as const)('does nothing in %s mode', (mode) => {
    const media = stubMatchMedia(false);
    const onChange = vi.fn();
    watchSystemTheme(() => mode, onChange);

    media.setDark(true);

    expect(onChange).not.toHaveBeenCalled();
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it('stops listening after unsubscribe', () => {
    const media = stubMatchMedia(false);
    const onChange = vi.fn();
    const unsubscribe = watchSystemTheme(() => 'system', onChange);

    unsubscribe();
    media.setDark(true);

    expect(media.listenerCount()).toBe(0);
    expect(onChange).not.toHaveBeenCalled();
  });
});
