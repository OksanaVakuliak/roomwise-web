import { act } from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';
import { Suspense } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Showcase } from '@/app/[locale]/(dev)/showcase/Showcase';
import ConfiguratorPage from '@/app/[locale]/configurator/page';
import HomePage from '@/app/[locale]/page';
import { blockingViolations } from '@/test/axe';
import {
  forEachLocale,
  forEachTheme,
  renderWithProviders,
} from '@/test/render-with-providers';

vi.mock('@/lib/api/client', () => ({ api: { GET: vi.fn() } }));
vi.mock('next-intl/server', () => ({
  setRequestLocale: vi.fn(),
  getTranslations: vi.fn(),
}));
vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={`/en${href}`} {...rest} />
  ),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => '/',
}));

const TIMEOUT = 180_000;

type Page = (locale: 'en' | 'uk') => React.ReactElement;

const pages: readonly (readonly [string, Page])[] = [
  [
    'home',
    (locale) => (
      <Suspense>
        <HomePage params={Promise.resolve({ locale })} />
      </Suspense>
    ),
  ],
  ['showcase', () => <Showcase />],
  [
    'step shell',
    (locale) => (
      <Suspense>
        <ConfiguratorPage params={Promise.resolve({ locale })} />
      </Suspense>
    ),
  ],
];

describe.each(pages)('%s', (_name, page) => {
  describe.each(forEachLocale)('locale %s', (locale) => {
    it.each(forEachTheme)(
      'has no critical or serious WCAG 2.2 AA violations in %s theme',
      async (theme) => {
        let container!: HTMLElement;
        await act(async () => {
          ({ container } = renderWithProviders(page(locale), {
            locale,
            theme,
          }));
        });

        expect(await blockingViolations(container)).toEqual([]);
      },
      TIMEOUT,
    );
  });
});
