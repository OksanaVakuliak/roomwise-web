import { act, fireEvent } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { usePathname, useRouter } from '@/i18n/navigation';
import { THEME_ATTRIBUTE } from '@/lib/theme/constants';
import { resetThemeDom } from '@/lib/theme/test-utils';
import { usePreferences } from '@/stores/preferences';
import en from '../../messages/en.json';
import uk from '../../messages/uk.json';
import { axe } from './axe';
import {
  categoryIds,
  makeCategoryProducts,
  makeEstimate,
  makeProduct,
  makeRate,
  makeStyles,
  productIds,
  styleIds,
} from './fixtures';
import { HarnessTitle } from './harness-title';
import {
  forEachLocale,
  forEachTheme,
  renderWithProviders,
} from './render-with-providers';
import { forEachViewport, setViewport, VIEWPORTS } from './viewports';

const catalogs = { en, uk };

afterEach(() => {
  resetThemeDom();
});

describe.each(forEachLocale)('locale %s', (locale) => {
  describe.each(forEachTheme)('theme %s', (theme) => {
    it('renders translated text and applies the theme', async () => {
      const { container, getByRole } = renderWithProviders(<HarnessTitle />, {
        locale,
        theme,
      });

      expect(getByRole('heading')).toHaveTextContent(
        catalogs[locale].Home.title,
      );
      expect(document.documentElement).toHaveAttribute(THEME_ATTRIBUTE, theme);
      expect(usePreferences.getState()).toMatchObject({ locale, theme });
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});

describe('viewports', () => {
  it.each(forEachViewport)('answers media queries for %ipx', (width) => {
    setViewport(width);

    expect(window.innerWidth).toBe(width);
    expect(window.matchMedia(`(min-width: ${width}px)`).matches).toBe(true);
    expect(window.matchMedia(`(max-width: ${width - 1}px)`).matches).toBe(
      false,
    );
    expect(
      window.matchMedia(`(min-width: ${width}px) and (max-width: ${width}px)`)
        .matches,
    ).toBe(true);
    expect(window.matchMedia('(prefers-color-scheme: dark)').matches).toBe(
      false,
    );
  });

  it('covers every breakpoint', () => {
    expect(forEachViewport).toHaveLength(VIEWPORTS.length);
  });

  it('dispatches resize', () => {
    let fired = 0;
    const onResize = () => {
      fired += 1;
    };
    window.addEventListener('resize', onResize);
    setViewport(768);
    window.removeEventListener('resize', onResize);

    expect(fired).toBe(1);
  });
});

function LocationProbe() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const goNext = useCallback(
    () => router.push('/configurator/result'),
    [router],
  );
  return (
    <>
      <p data-testid="pathname">{pathname}</p>
      <p data-testid="room">{searchParams.get('room') ?? ''}</p>
      <button type="button" onClick={goNext}>
        next
      </button>
    </>
  );
}

describe.each(forEachLocale)('query cache for %s', (locale) => {
  it('seeds catalog fixtures under locale keys', () => {
    const { queryClient } = renderWithProviders(<HarnessTitle />, { locale });

    expect(queryClient.getQueryData(['styles', locale])).toEqual(makeStyles());
    expect(queryClient.getQueryData(['room-types', locale])).toBeDefined();
    expect(queryClient.getQueryData(['engineering', locale])).toBeDefined();
    expect(
      queryClient.getQueryData(['products', categoryIds.floor, locale]),
    ).toEqual(makeCategoryProducts(categoryIds.floor));
    expect(
      queryClient.getQueryData(['product', productIds.laminate, locale]),
    ).toBeDefined();
    expect(
      queryClient.getQueryData(['default-materials', styleIds.modern]),
    ).toBeDefined();
    expect(
      queryClient.getQueryData(['styles', locale === 'en' ? 'uk' : 'en']),
    ).toBeUndefined();
  });
});

describe('query cache', () => {
  it('stays empty without catalog', () => {
    const { queryClient } = renderWithProviders(<HarnessTitle />, {
      catalog: false,
    });

    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });
});

describe('location', () => {
  it.each(forEachLocale)('exposes url and search params in %s', (locale) => {
    const { getByTestId, location } = renderWithProviders(<LocationProbe />, {
      locale,
      url: '/configurator/interior?room=r-2',
    });

    expect(getByTestId('pathname')).toHaveTextContent('/configurator/interior');
    expect(getByTestId('room')).toHaveTextContent('r-2');
    expect(location().pathname).toBe(`/${locale}/configurator/interior`);
  });

  it('follows router navigation', () => {
    const { getByRole, getByTestId, router } = renderWithProviders(
      <LocationProbe />,
      { url: '/configurator/interior?room=r-2' },
    );

    act(() => {
      fireEvent.click(getByRole('button', { name: 'next' }));
    });

    expect(router.push).toHaveBeenCalledTimes(1);
    expect(getByTestId('pathname')).toHaveTextContent('/configurator/result');
    expect(getByTestId('room')).toBeEmptyDOMElement();
  });
});

describe('fixtures', () => {
  it('builds typed defaults with overrides', () => {
    expect(makeProduct({ priceCents: 100 }).priceCents).toBe(100);
    expect(makeRate().uahPerUsd).toBe(41.5);
    expect(makeEstimate().totalCents).toBeGreaterThan(0);
  });
});
