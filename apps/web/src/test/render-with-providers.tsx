import type { PricingData } from '@roomwise/calc-engine';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type RenderOptions, render } from '@testing-library/react';
import {
  AppRouterContext,
  type AppRouterInstance,
} from 'next/dist/shared/lib/app-router-context.shared-runtime';
import {
  PathnameContext,
  SearchParamsContext,
} from 'next/dist/shared/lib/hooks-client-context.shared-runtime';
import { type Locale, NextIntlClientProvider } from 'next-intl';
import {
  type ReactElement,
  type ReactNode,
  useMemo,
  useSyncExternalStore,
} from 'react';
import { vi } from 'vitest';
import { routing } from '@/i18n/routing';
import type { Currency } from '@/lib/format';
import { applyTheme, type ThemeMode } from '@/lib/theme';
import { usePreferences } from '@/stores/preferences';
import { resetPricingData, seedPricingData } from '@/stores/pricing-data';
import en from '../../messages/en.json';
import uk from '../../messages/uk.json';
import {
  categoryIds,
  makeCategoryProducts,
  makeDefaultMaterials,
  makeEngineering,
  makePricingData,
  makeProductDetails,
  makeRoomTypes,
  makeStyles,
  productIds,
  styleIds,
} from './fixtures';

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
  preferences?: Partial<ReturnType<typeof usePreferences.getState>>;
  url?: string;
  catalog?: boolean;
  pricing?: PricingData | false;
  queryClient?: QueryClient;
  renderOptions?: Omit<RenderOptions, 'wrapper'>;
};

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity, gcTime: Infinity },
      mutations: { retry: false },
    },
  });
}

export function seedCatalog(queryClient: QueryClient, lang: Locale) {
  queryClient.setQueryData(['styles', lang], makeStyles());
  queryClient.setQueryData(['room-types', lang], makeRoomTypes());
  queryClient.setQueryData(['engineering', lang], makeEngineering());
  for (const categoryId of Object.values(categoryIds)) {
    queryClient.setQueryData(
      ['products', categoryId, lang],
      makeCategoryProducts(categoryId),
    );
  }
  for (const productId of Object.values(productIds)) {
    queryClient.setQueryData(
      ['product', productId, lang],
      makeProductDetails(productId),
    );
  }
  for (const styleId of Object.values(styleIds)) {
    queryClient.setQueryData(
      ['default-materials', styleId],
      makeDefaultMaterials(styleId),
    );
  }
}

function createLocation(initial: string) {
  let current = new URL(initial, 'http://localhost');
  const listeners = new Set<() => void>();
  return {
    get: () => current,
    set(href: string) {
      current = new URL(href, current);
      for (const listener of listeners) listener();
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export function renderWithProviders(
  ui: ReactElement,
  {
    locale = 'en',
    theme = 'light',
    currency = 'USD',
    preferences,
    url = '/',
    catalog = true,
    pricing = makePricingData(),
    queryClient = createTestQueryClient(),
    renderOptions,
  }: Options = {},
) {
  usePreferences.setState({ locale, currency, theme, ...preferences });
  applyTheme(theme);
  if (catalog) seedCatalog(queryClient, locale);
  resetPricingData();
  if (pricing) seedPricingData(pricing, null);

  const location = createLocation(`/${locale}${url === '/' ? '' : url}`);
  const router = {
    push: vi.fn((href: string) => location.set(href)),
    replace: vi.fn((href: string) => location.set(href)),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    bfcacheId: '_b_0_',
  } satisfies AppRouterInstance;

  function Wrapper({ children }: { children: ReactNode }) {
    const current = useSyncExternalStore(location.subscribe, location.get);
    const searchParams = useMemo(
      () => new URLSearchParams(current.search),
      [current],
    );
    return (
      <AppRouterContext.Provider value={router}>
        <PathnameContext.Provider value={current.pathname}>
          <SearchParamsContext.Provider value={searchParams}>
            <QueryClientProvider client={queryClient}>
              <NextIntlClientProvider
                locale={locale}
                messages={catalogs[locale]}
              >
                {children}
              </NextIntlClientProvider>
            </QueryClientProvider>
          </SearchParamsContext.Provider>
        </PathnameContext.Provider>
      </AppRouterContext.Provider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
    router,
    location: () => location.get(),
  };
}
