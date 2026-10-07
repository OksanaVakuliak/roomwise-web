import { type RenderOptions, render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactElement, ReactNode } from 'react';
import { routing } from '@/i18n/routing';
import type { Currency, ExchangeRate } from '@/lib/format';
import { applyTheme, type ThemeMode } from '@/lib/theme';
import { usePreferences } from '@/stores/preferences';
import en from '../../messages/en.json';
import uk from '../../messages/uk.json';

type Locale = (typeof routing.locales)[number];

const catalogs: Record<Locale, typeof en> = { en, uk };

export const forEachLocale: readonly (readonly [Locale])[] =
  routing.locales.map((locale) => [locale] as const);

export const forEachTheme: readonly (readonly ['light' | 'dark'])[] = [
  ['light'],
  ['dark'],
];

type Options = {
  locale?: Locale;
  theme?: ThemeMode;
  currency?: Currency;
  rate?: ExchangeRate;
  preferences?: Partial<ReturnType<typeof usePreferences.getState>>;
  renderOptions?: Omit<RenderOptions, 'wrapper'>;
};

export function renderWithProviders(
  ui: ReactElement,
  {
    locale = 'en',
    theme = 'light',
    currency = 'USD',
    rate,
    preferences,
    renderOptions,
  }: Options = {},
) {
  usePreferences.setState({ locale, currency, theme, ...preferences });
  applyTheme(theme);

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <NextIntlClientProvider locale={locale} messages={catalogs[locale]}>
        {children}
      </NextIntlClientProvider>
    );
  }

  return { ...render(ui, { wrapper: Wrapper, ...renderOptions }), rate };
}
