import { act, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';
import { Suspense } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { CONFIGURATOR_PATH } from '@/config/routes';
import { axe } from '@/test/axe';
import {
  forEachLocale,
  renderWithProviders,
} from '@/test/render-with-providers';
import HomePage, { generateMetadata } from './page';

vi.mock('next-intl/server', () => ({ setRequestLocale: vi.fn() }));
vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={`/en${href}`} {...rest} />
  ),
}));

async function renderPage(locale: 'en' | 'uk' = 'en') {
  let result!: ReturnType<typeof renderWithProviders>;

  await act(async () => {
    result = renderWithProviders(
      <Suspense>
        <HomePage params={Promise.resolve({ locale })} />
      </Suspense>,
      { locale },
    );
  });

  return result;
}

describe('HomePage', () => {
  it.each([
    ['en', '/en'],
    ['uk', '/uk'],
  ] as const)('declares alternates for %s', async (locale, canonical) => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale }),
    });

    expect(metadata).toEqual({
      alternates: {
        canonical,
        languages: { en: '/en', uk: '/uk', 'x-default': '/' },
      },
    });
  });

  it('has exactly one h1', async () => {
    await renderPage();

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('lists the five steps', async () => {
    await renderPage();

    expect(screen.getAllByRole('listitem')).toHaveLength(5);
  });

  it('leads the start button to the configurator', async () => {
    await renderPage();

    expect(
      screen.getByRole('link', { name: 'Start calculation' }),
    ).toHaveAttribute('href', `/en${CONFIGURATOR_PATH}`);
  });

  it('is translated to Ukrainian', async () => {
    await renderPage('uk');

    expect(
      screen.getByRole('link', { name: 'Почати розрахунок' }),
    ).toBeInTheDocument();
  });

  it.each(forEachLocale)('has no axe violations in %s', async (locale) => {
    const { container } = await renderPage(locale);

    expect(await axe(container)).toHaveNoViolations();
  });
});
