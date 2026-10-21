import { act, screen, within } from '@testing-library/react';
import { getTranslations } from 'next-intl/server';
import type { AnchorHTMLAttributes } from 'react';
import { Suspense } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetExchangeRate } from '@/stores/exchange-rate';
import { usePreferences } from '@/stores/preferences';
import { axe } from '@/test/axe';
import { setLoadedRate } from '@/test/fixtures/exchange-rate';
import {
  forEachLocale,
  renderWithProviders,
} from '@/test/render-with-providers';
import en from '../../../../messages/en.json';
import ConfiguratorPage, { generateMetadata } from './page';

vi.mock('@/lib/api/client', () => ({ api: { GET: vi.fn() } }));
vi.mock('next-intl/server', () => ({
  setRequestLocale: vi.fn(),
  getTranslations: vi.fn(),
}));
vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={`/en${href}`} {...rest} />
  ),
}));

async function renderPage(locale: 'en' | 'uk') {
  let result!: ReturnType<typeof renderWithProviders>;

  await act(async () => {
    result = renderWithProviders(
      <Suspense>
        <ConfiguratorPage params={Promise.resolve({ locale })} />
      </Suspense>,
      { locale },
    );
  });

  return result;
}

describe('ConfiguratorPage', () => {
  it.each([
    ['en', '/en/configurator'],
    ['uk', '/uk/configurator'],
  ] as const)('declares alternates for %s', async (locale, canonical) => {
    vi.mocked(getTranslations).mockResolvedValue(
      (() => 'Title') as unknown as Awaited<ReturnType<typeof getTranslations>>,
    );

    const metadata = await generateMetadata({
      params: Promise.resolve({ locale }),
    });

    expect(metadata.alternates).toEqual({
      canonical,
      languages: {
        en: '/en/configurator',
        uk: '/uk/configurator',
        'x-default': '/configurator',
      },
    });
  });

  beforeEach(() => {
    resetExchangeRate();
  });

  it.each(forEachLocale)(
    'has one h1 and no axe violations in %s',
    async (locale) => {
      const { container } = await renderPage(locale);

      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
      expect(await axe(container)).toHaveNoViolations();
    },
  );

  it('shows the estimate in the selected currency', async () => {
    await renderPage('en');
    const cost = screen.getByRole('region', { name: en.StepLayout.cost });
    expect(within(cost).getAllByText(/\$/).length).toBeGreaterThan(0);

    await act(async () => {
      setLoadedRate();
      usePreferences.getState().setCurrency('UAH');
    });

    expect(within(cost).getAllByText(/₴|грн|UAH/).length).toBeGreaterThan(0);
    expect(within(cost).getByText(/NBU rate/)).toBeInTheDocument();
  });

  it('keeps dollars while the hryvnia rate is not loaded', async () => {
    await renderPage('en');
    const cost = screen.getByRole('region', { name: en.StepLayout.cost });

    await act(async () => {
      usePreferences.getState().setCurrency('UAH');
    });

    expect(within(cost).getAllByText(/\$/).length).toBeGreaterThan(0);
    expect(within(cost).queryByText(/NBU rate/)).not.toBeInTheDocument();
  });
});
