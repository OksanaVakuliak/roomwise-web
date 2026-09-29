import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { THEME_COLORS, THEME_STORAGE_KEY } from './constants';
import { themeInitScript } from './script';
import { breakStorage, resetThemeDom, stubMatchMedia } from './test-utils';

const run = () => new Function(themeInitScript)();
const themeColor = () =>
  document.head.querySelector<HTMLMetaElement>('meta[name="theme-color"]');

beforeEach(() => {
  resetThemeDom();
  stubMatchMedia(false);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('themeInitScript', () => {
  it.each([
    ['light', true, 'light'],
    ['dark', false, 'dark'],
    ['system', true, 'dark'],
    ['system', false, 'light'],
    ['garbage', true, 'dark'],
    ['garbage', false, 'light'],
  ] as const)(
    'stored %s with system dark=%s sets %s',
    (stored, dark, expected) => {
      stubMatchMedia(dark);
      window.localStorage.setItem(THEME_STORAGE_KEY, stored);

      run();

      expect(document.documentElement.dataset.theme).toBe(expected);
      expect(themeColor()?.content).toBe(THEME_COLORS[expected]);
    },
  );

  it('falls back to the system theme when nothing is stored', () => {
    stubMatchMedia(true);
    run();
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('falls back to the system theme when storage throws', () => {
    stubMatchMedia(true);
    breakStorage('getItem');

    run();

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(themeColor()?.content).toBe(THEME_COLORS.dark);
  });

  it('updates an existing meta without adding another', () => {
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);

    run();

    expect(
      document.head.querySelectorAll('meta[name="theme-color"]'),
    ).toHaveLength(1);
    expect(meta.content).toBe(THEME_COLORS.light);
  });

  it('does not throw when matchMedia is missing', () => {
    Reflect.deleteProperty(window, 'matchMedia');
    expect(run).not.toThrow();
  });
});
