import { act, screen } from '@testing-library/react';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import {
  forEachLocale,
  renderWithProviders,
} from '@/test/render-with-providers';
import en from '../../../../../messages/en.json';
import ObjectPage, { generateMetadata } from './page';

vi.mock('next-intl/server', () => ({
  setRequestLocale: vi.fn(),
  getTranslations: vi.fn(),
}));

async function renderPage(locale: 'en' | 'uk') {
  let result!: ReturnType<typeof renderWithProviders>;

  await act(async () => {
    result = renderWithProviders(
      <Suspense>
        <ObjectPage params={Promise.resolve({ locale })} />
      </Suspense>,
      { locale },
    );
  });

  return result;
}

describe('ObjectPage', () => {
  it.each([
    ['en', '/en/configurator/object'],
    ['uk', '/uk/configurator/object'],
  ] as const)('declares alternates for %s', async (locale, canonical) => {
    vi.mocked(getTranslations).mockResolvedValue(
      ((key: string) => key) as unknown as Awaited<
        ReturnType<typeof getTranslations>
      >,
    );

    const metadata = await generateMetadata({
      params: Promise.resolve({ locale }),
    });

    expect(metadata.title).toBe('object');
    expect(metadata.alternates).toEqual({
      canonical,
      languages: {
        en: '/en/configurator/object',
        uk: '/uk/configurator/object',
        'x-default': '/configurator/object',
      },
    });
  });

  it.each(forEachLocale)(
    'has one h1 and no axe violations in %s',
    async (locale) => {
      const { container } = await renderPage(locale);

      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
      expect(await axe(container)).toHaveNoViolations();
    },
  );

  it('names the step in the heading', async () => {
    await renderPage('en');

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: en.ConfiguratorSteps.heading.object,
      }),
    ).toBeInTheDocument();
  });
});
