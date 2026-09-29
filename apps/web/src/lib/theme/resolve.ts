import { type ResolvedTheme, THEME_MODES, type ThemeMode } from './constants';

export function parseThemeMode(value: unknown): ThemeMode {
  return THEME_MODES.find((mode) => mode === value) ?? 'system';
}

export function resolveTheme(
  mode: ThemeMode,
  systemPrefersDark: boolean,
): ResolvedTheme {
  if (mode === 'system') {
    return systemPrefersDark ? 'dark' : 'light';
  }
  return mode;
}
