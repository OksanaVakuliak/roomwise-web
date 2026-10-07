import { afterEach, describe, expect, it } from 'vitest';
import { THEME_ATTRIBUTE } from '@/lib/theme/constants';
import { resetThemeDom } from '@/lib/theme/test-utils';
import { usePreferences } from '@/stores/preferences';
import en from '../../messages/en.json';
import uk from '../../messages/uk.json';
import { axe } from './axe';
import { makeEstimate, makeProduct, makeRate } from './fixtures';
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

describe('fixtures', () => {
  it('builds typed defaults with overrides', () => {
    expect(makeProduct({ priceCents: 100 }).priceCents).toBe(100);
    expect(makeRate().uahPerUsd).toBe(41.5);
    expect(makeEstimate().totalCents).toBeGreaterThan(0);
  });
});
