import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  act,
  fireEvent,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfiguratorEstimate } from '@/app/[locale]/configurator/ConfiguratorEstimate';
import { api } from '@/lib/api/client';
import { THEME_COLORS, THEME_STORAGE_KEY } from '@/lib/theme';
import { resetThemeDom, stubMatchMedia } from '@/lib/theme/test-utils';
import { resetExchangeRate } from '@/stores/exchange-rate';
import { PREFERENCES_STORAGE_KEY, usePreferences } from '@/stores/preferences';
import { setLoadedRate } from '@/test/fixtures/exchange-rate';
import { renderWithProviders } from '@/test/render-with-providers';
import { ExchangeRateNotice } from './ExchangeRateNotice/ExchangeRateNotice';
import { PreferenceSwitches } from './PreferenceSwitches/PreferenceSwitches';

const navigation = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock('@/lib/api/client', () => ({ api: { GET: vi.fn() } }));
vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace: navigation.replace }),
  usePathname: () => '/configurator',
  Link: () => null,
}));

const get = vi.mocked(api.GET) as unknown as ReturnType<typeof vi.fn>;

function themeColor() {
  return document
    .querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    ?.getAttribute('content');
}

function dataTheme() {
  return document.documentElement.getAttribute('data-theme');
}

function seedStorage(currency: 'USD' | 'UAH', theme: string) {
  window.localStorage.setItem(
    PREFERENCES_STORAGE_KEY,
    JSON.stringify({ state: { locale: 'en', currency }, version: 1 }),
  );
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

async function startSession() {
  vi.resetModules();
  const { usePreferences: store } = await import('@/stores/preferences');
  const { usePreferencesHydration } = await import(
    '@/stores/use-preferences-hydration'
  );
  const mount = () => renderHook(() => usePreferencesHydration());
  return { store, mount };
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  resetThemeDom();
  resetExchangeRate();
  navigation.replace.mockClear();
  get.mockReset();
  stubMatchMedia(false);
  window.history.replaceState(null, '', '/');
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('switching the language', () => {
  it('keeps the path, query and hash', () => {
    window.history.replaceState(null, '', '/configurator?step=2&room=7#cost');
    renderWithProviders(<PreferenceSwitches />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Switch language to Ukrainian' }),
    );

    expect(navigation.replace).toHaveBeenCalledWith(
      '/configurator?step=2&room=7#cost',
      { locale: 'uk' },
    );
  });

  it('switches back to English from a Ukrainian page', () => {
    window.history.replaceState(null, '', '/configurator?step=2');
    renderWithProviders(<PreferenceSwitches />, { locale: 'uk' });

    fireEvent.click(
      screen.getByRole('button', { name: 'Змінити мову на англійську' }),
    );

    expect(navigation.replace).toHaveBeenCalledWith('/configurator?step=2', {
      locale: 'en',
    });
  });

  it('keeps entered data, the other preferences and storage', async () => {
    const clear = vi.spyOn(window.localStorage, 'clear');
    window.localStorage.setItem('roomwise-draft', '{"length":4.2}');
    seedStorage('UAH', 'dark');
    setLoadedRate();
    renderWithProviders(
      <>
        <input aria-label="Length" />
        <PreferenceSwitches />
      </>,
      { currency: 'UAH', theme: 'dark' },
    );
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Switch currency to USD' }),
      ).toHaveTextContent('₴'),
    );
    const field = screen.getByRole<HTMLInputElement>('textbox', {
      name: 'Length',
    });
    fireEvent.change(field, { target: { value: '4.2' } });

    fireEvent.click(
      screen.getByRole('button', { name: 'Switch language to Ukrainian' }),
    );

    expect(field.value).toBe('4.2');
    expect(usePreferences.getState().currency).toBe('UAH');
    expect(usePreferences.getState().theme).toBe('dark');
    expect(usePreferences.getState().locale).toBe('uk');
    expect(window.localStorage.getItem('roomwise-draft')).toBe(
      '{"length":4.2}',
    );
    expect(clear).not.toHaveBeenCalled();
  });
});

describe('switching the currency', () => {
  function renderEstimate(currency?: 'USD' | 'UAH') {
    return renderWithProviders(
      <>
        <PreferenceSwitches />
        <ConfiguratorEstimate />
        <ExchangeRateNotice />
      </>,
      { currency },
    );
  }

  async function waitForHydration() {
    await screen.findByRole('button', { name: 'Switch currency to UAH' });
  }

  it('updates the amounts in under a second without a reload', async () => {
    setLoadedRate();
    renderEstimate();
    await waitForHydration();
    expect(screen.getAllByText(/\$/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/NBU rate/)).not.toBeInTheDocument();
    const unload = vi.fn();
    window.addEventListener('beforeunload', unload);

    const started = performance.now();
    fireEvent.click(
      screen.getByRole('button', { name: 'Switch currency to UAH' }),
    );
    await screen.findByText(/NBU rate/);
    const elapsed = performance.now() - started;
    window.removeEventListener('beforeunload', unload);

    expect(elapsed).toBeLessThan(1000);
    expect(unload).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Switch currency to USD' }),
    ).toHaveTextContent('₴');
    expect(screen.getAllByText(/₴/).length).toBeGreaterThan(0);
  });

  it('returns to dollars and explains it when the rate is unavailable', async () => {
    get.mockResolvedValue({ data: { exchangeRate: null } });
    renderEstimate();
    await waitForHydration();

    fireEvent.click(
      screen.getByRole('button', { name: 'Switch currency to UAH' }),
    );

    expect(
      await screen.findByText(
        'The hryvnia rate is unavailable right now, so amounts are shown in US dollars.',
      ),
    ).toBeInTheDocument();
    expect(usePreferences.getState().currency).toBe('USD');
    expect(screen.getAllByText(/\$/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/NBU rate/)).not.toBeInTheDocument();
  });

  it('shows no rate note in dollars', async () => {
    setLoadedRate();
    renderEstimate();
    await waitForHydration();

    expect(screen.queryByText(/rate/i)).not.toBeInTheDocument();
  });

  it('keeps a saved UAH after a failed load and shows dollars with the notice', async () => {
    get.mockResolvedValue({ data: { exchangeRate: null } });
    renderEstimate('UAH');
    await waitFor(() =>
      expect(
        screen.getByText(/The hryvnia rate is unavailable right now/),
      ).toBeInTheDocument(),
    );

    expect(
      screen.getByRole('button', { name: 'Switch currency to UAH' }),
    ).toHaveTextContent('$');
    expect(screen.getAllByText(/\$/).length).toBeGreaterThan(0);
    expect(usePreferences.getState().currency).toBe('UAH');
    expect(
      JSON.parse(window.localStorage.getItem(PREFERENCES_STORAGE_KEY) ?? '{}')
        .state.currency,
    ).toBe('UAH');
  });

  it('retries on click after a failed load', async () => {
    get.mockResolvedValueOnce({ data: { exchangeRate: null } });
    renderEstimate();
    await waitForHydration();
    fireEvent.click(
      screen.getByRole('button', { name: 'Switch currency to UAH' }),
    );
    await screen.findByText(/The hryvnia rate is unavailable right now/);
    expect(usePreferences.getState().currency).toBe('USD');

    get.mockResolvedValueOnce({
      data: {
        exchangeRate: { rate: '41.5', date: '2026-10-01', source: 'NBU' },
      },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Switch currency to UAH' }),
    );

    await screen.findByText(/NBU rate/);
    expect(get).toHaveBeenCalledTimes(2);
    expect(
      screen.getByRole('button', { name: 'Switch currency to USD' }),
    ).toHaveTextContent('₴');
    expect(
      screen.queryByText(/The hryvnia rate is unavailable right now/),
    ).not.toBeInTheDocument();
  });

  it('shows dollars on the switch while the rate is loading', async () => {
    get.mockReturnValue(new Promise(() => {}));
    renderEstimate('UAH');

    const toggle = await screen.findByRole('button', {
      name: 'Switch currency to UAH',
    });

    expect(toggle).toHaveTextContent('$');
    expect(screen.queryAllByText(/₴/)).toHaveLength(0);
    expect(usePreferences.getState().currency).toBe('UAH');
  });

  it('returns to dollars when the rate request fails', async () => {
    get.mockRejectedValue(new Error('offline'));
    renderEstimate();
    await waitForHydration();

    fireEvent.click(
      screen.getByRole('button', { name: 'Switch currency to UAH' }),
    );

    await waitFor(() => expect(usePreferences.getState().currency).toBe('USD'));
    expect(
      screen.getByText(/The hryvnia rate is unavailable right now/),
    ).toBeInTheDocument();
  });
});

describe('choices after a reload', () => {
  it('restores the currency and the theme', async () => {
    const first = await startSession();
    const firstMount = first.mount();
    await waitFor(() => expect(firstMount.result.current).toBe(true));
    act(() => {
      first.store.getState().setCurrency('UAH');
      first.store.getState().setTheme('dark');
    });
    firstMount.unmount();

    const second = await startSession();
    expect(second.store.getState().currency).toBe('USD');
    expect(second.store.getState().theme).toBe('system');
    const secondMount = second.mount();
    await waitFor(() => expect(secondMount.result.current).toBe(true));

    expect(second.store.getState().currency).toBe('UAH');
    expect(second.store.getState().theme).toBe('dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(dataTheme()).toBe('dark');
    expect(themeColor()).toBe(THEME_COLORS.dark);
  });

  it('restores the language choice', async () => {
    const first = await startSession();
    const firstMount = first.mount();
    await waitFor(() => expect(firstMount.result.current).toBe(true));
    act(() => first.store.getState().setLocale('uk'));
    firstMount.unmount();

    const second = await startSession();
    const secondMount = second.mount();
    await waitFor(() => expect(secondMount.result.current).toBe(true));

    expect(second.store.getState().locale).toBe('uk');
  });
});

describe('invalid stored values', () => {
  async function hydrateWith(preferences: string, theme: string | null) {
    window.localStorage.setItem(PREFERENCES_STORAGE_KEY, preferences);
    if (theme !== null) {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
    const session = await startSession();
    const mounted = session.mount();
    await waitFor(() => expect(mounted.result.current).toBe(true));
    return session.store.getState();
  }

  it.each([
    ['garbage JSON', '{not json', 'neon'],
    ['a JSON scalar', '42', 'neon'],
    ['null', 'null', 'null'],
    [
      'unknown values',
      JSON.stringify({ state: { locale: 'de', currency: 'EUR' }, version: 1 }),
      'purple',
    ],
    [
      'wrong types',
      JSON.stringify({ state: { locale: 1, currency: {} }, version: 1 }),
      'DARK',
    ],
    [
      'an unknown schema version',
      JSON.stringify({
        state: { locale: 'uk', currency: 'UAH' },
        version: 99,
      }),
      'neon',
    ],
  ])('falls back to the defaults for %s', async (_, preferences, theme) => {
    const state = await hydrateWith(preferences, theme);

    expect(state.currency).toBe('USD');
    expect(state.locale).toBe('en');
    expect(state.theme).toBe('system');
    expect(dataTheme()).toBe('light');
  });

  it('keeps a valid value next to an invalid one', async () => {
    const state = await hydrateWith(
      JSON.stringify({ state: { locale: 'xx', currency: 'UAH' }, version: 1 }),
      null,
    );

    expect(state.currency).toBe('UAH');
    expect(state.locale).toBe('en');
  });
});

describe('theme', () => {
  function renderSwitches(theme: 'light' | 'dark' | 'system') {
    seedStorage('USD', theme);
    return renderWithProviders(<PreferenceSwitches />, { theme });
  }

  it('keeps an explicit light theme when the system turns dark', () => {
    const media = stubMatchMedia(false);
    renderSwitches('light');
    expect(dataTheme()).toBe('light');

    act(() => media.setDark(true));

    expect(dataTheme()).toBe('light');
    expect(themeColor()).toBe(THEME_COLORS.light);
  });

  it('keeps an explicit dark theme when the system turns light', () => {
    const media = stubMatchMedia(true);
    renderSwitches('dark');

    act(() => media.setDark(false));

    expect(dataTheme()).toBe('dark');
    expect(themeColor()).toBe(THEME_COLORS.dark);
  });

  it('follows the system in system mode and updates the browser color', () => {
    const media = stubMatchMedia(false);
    renderSwitches('system');
    expect(dataTheme()).toBe('light');
    expect(themeColor()).toBe(THEME_COLORS.light);

    act(() => media.setDark(true));
    expect(dataTheme()).toBe('dark');
    expect(themeColor()).toBe(THEME_COLORS.dark);

    act(() => media.setDark(false));
    expect(dataTheme()).toBe('light');
    expect(themeColor()).toBe(THEME_COLORS.light);
  });

  it('stops following the system once a theme is chosen explicitly', () => {
    const media = stubMatchMedia(false);
    renderSwitches('system');

    act(() => usePreferences.getState().setTheme('light'));
    act(() => media.setDark(true));

    expect(dataTheme()).toBe('light');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });
});

describe('material images and the theme', () => {
  const root = join(import.meta.dirname, '..', '..');
  const imageSelector =
    /(^|[\s>+~,(])(img|picture|image)\b|\.(image|img|photo|texture|textures|material|thumbnail|thumb)\b/i;
  const forbidden =
    /(^|[\s;{])(filter|backdrop-filter|mix-blend-mode|opacity)\s*:/;

  function cssFiles(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        return cssFiles(path);
      }
      return entry.name.endsWith('.css') ? [path] : [];
    });
  }

  function rules(source: string) {
    const stripped = source.replace(/\/\*[\s\S]*?\*\//g, '');
    return [...stripped.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
      selector: match[1].trim(),
      body: match[2],
    }));
  }

  const files = cssFiles(join(root, 'components'));

  it('finds the style sheets of the image components', () => {
    const names = files.map((file) => file.split(/[\\/]/).pop());

    expect(names).toEqual(
      expect.arrayContaining([
        'ImageWithFallback.module.css',
        'StyleCard.module.css',
        'RoomScene.module.css',
      ]),
    );
  });

  it('recognises an image rule that would break the check', () => {
    const [rule] = rules('.card img { opacity: 0.8; }');

    expect(imageSelector.test(rule.selector)).toBe(true);
    expect(forbidden.test(rule.body)).toBe(true);
  });

  it('does not take Button filters for image rules', () => {
    const [rule] = rules('.fill:hover { filter: brightness(1.12); }');

    expect(imageSelector.test(rule.selector)).toBe(false);
  });

  it.each(files.map((file) => [file.slice(root.length + 1), file]))(
    'applies no filter, blend mode or opacity to images in %s',
    (_, file) => {
      const offending = rules(readFileSync(file, 'utf8')).filter(
        ({ selector, body }) =>
          imageSelector.test(selector) && forbidden.test(body),
      );

      expect(offending).toEqual([]);
    },
  );

  it('has no dark-theme rule that touches images', () => {
    const offending = cssFiles(root).flatMap((file) =>
      rules(readFileSync(file, 'utf8'))
        .filter(
          ({ selector }) =>
            /data-theme/.test(selector) && imageSelector.test(selector),
        )
        .map(({ selector }) => `${file}: ${selector}`),
    );

    expect(offending).toEqual([]);
  });
});
