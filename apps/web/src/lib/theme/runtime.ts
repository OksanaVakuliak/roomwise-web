import {
  DARK_SCHEME_QUERY,
  type ResolvedTheme,
  THEME_ATTRIBUTE,
  THEME_COLORS,
  THEME_STORAGE_KEY,
  type ThemeMode,
} from './constants';
import { parseThemeMode, resolveTheme } from './resolve';

export function readThemeMode(): ThemeMode {
  try {
    return parseThemeMode(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return 'system';
  }
}

export function writeThemeMode(mode: ThemeMode): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    return;
  }
}

function setThemeColor(color: string): void {
  let meta = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]',
  );
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.content = color;
}

export function applyTheme(mode: ThemeMode): ResolvedTheme {
  const systemPrefersDark =
    window.matchMedia?.(DARK_SCHEME_QUERY).matches ?? false;
  const theme = resolveTheme(mode, systemPrefersDark);
  document.documentElement.setAttribute(THEME_ATTRIBUTE, theme);
  setThemeColor(THEME_COLORS[theme]);
  return theme;
}

export function watchSystemTheme(
  getMode: () => ThemeMode,
  onChange: (theme: ResolvedTheme) => void,
): () => void {
  const query = window.matchMedia?.(DARK_SCHEME_QUERY);
  if (!query) {
    return () => {};
  }
  const listener = () => {
    const mode = getMode();
    if (mode === 'system') {
      onChange(applyTheme(mode));
    }
  };
  query.addEventListener('change', listener);
  return () => query.removeEventListener('change', listener);
}
