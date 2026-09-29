export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'roomwise-theme';
export const THEME_ATTRIBUTE = 'data-theme';
export const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';

export const THEME_MODES: readonly ThemeMode[] = ['system', 'light', 'dark'];

export const THEME_COLORS: Record<ResolvedTheme, string> = {
  light: '#e4e9e6',
  dark: '#123049',
};
