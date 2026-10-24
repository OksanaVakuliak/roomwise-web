import { describe, expect, it } from 'vitest';
import { parseThemeMode, resolveTheme } from './resolve';

describe('resolveTheme', () => {
  it.each([
    ['system', false, 'light'],
    ['system', true, 'dark'],
    ['light', false, 'light'],
    ['light', true, 'light'],
    ['dark', false, 'dark'],
    ['dark', true, 'dark'],
  ] as const)(
    '%s with system dark=%s resolves to %s',
    (mode, dark, expected) => {
      expect(resolveTheme(mode, dark)).toBe(expected);
    },
  );
});

describe('parseThemeMode', () => {
  it.each(['system', 'light', 'dark'])('keeps %s', (value) => {
    expect(parseThemeMode(value)).toBe(value);
  });

  it.each([null, undefined, '', 'blue', 'DARK', 1, {}])(
    'falls back to system for %j',
    (value) => {
      expect(parseThemeMode(value)).toBe('system');
    },
  );
});
