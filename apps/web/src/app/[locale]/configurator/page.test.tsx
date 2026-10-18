import { act, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';
import { Suspense } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import {
  forEachLocale,
  renderWithProviders,
} from '@/test/render-with-providers';
import ConfiguratorPage from './page';

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
  it.each(forEachLocale)(
    'has one h1 and no axe violations in %s',
    async (locale) => {
      const { container } = await renderPage(locale);

      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
      expect(await axe(container)).toHaveNoViolations();
    },
  );
});
