import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, screen, within } from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';
import { Suspense } from 'react';
import { describe, expect, it, vi } from 'vitest';
import ObjectPage from '@/app/[locale]/configurator/object/page';
import HomePage from '@/app/[locale]/page';
import { axe } from '@/test/axe';
import {
  forEachLocale,
  renderWithProviders,
} from '@/test/render-with-providers';
import { forEachViewport, setViewport } from '@/test/viewports';
import en from '../../../messages/en.json';
import { AppFooter } from './AppFooter/AppFooter';
import { AppHeader } from './AppHeader/AppHeader';
import { MAIN_ID } from './SkipLink/main-id';
import { SkipLink } from './SkipLink/SkipLink';

vi.mock('next-intl/server', () => ({
  setRequestLocale: vi.fn(),
  getTranslations: vi.fn(),
}));
vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={`/en${href === '/' ? '' : href}`} {...rest} />
  ),
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/',
}));

const TABBABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const pages = {
  home: HomePage,
  configurator: ObjectPage,
} as const;

type PageName = keyof typeof pages;

const forEachPage = (Object.keys(pages) as PageName[]).map(
  (name) => [name] as const,
);

async function renderShell(
  name: PageName,
  locale: 'en' | 'uk' = 'en',
  width = 1440,
) {
  setViewport(width);
  const Page = pages[name];
  let result!: ReturnType<typeof renderWithProviders>;

  await act(async () => {
    result = renderWithProviders(
      <>
        <SkipLink />
        <AppHeader />
        <main id={MAIN_ID} tabIndex={-1}>
          <Suspense>
            <Page params={Promise.resolve({ locale })} />
          </Suspense>
        </main>
        <AppFooter />
      </>,
      { locale },
    );
  });

  return result;
}

function tabbables(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(TABBABLE)];
}

function precedes(first: Element, second: Element): boolean {
  return Boolean(
    first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING,
  );
}

describe.each(forEachPage)('page shell: %s', (name) => {
  it.each(forEachLocale)('has one of each landmark in %s', async (locale) => {
    await renderShell(name, locale);

    expect(screen.getAllByRole('banner')).toHaveLength(1);
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getAllByRole('contentinfo')).toHaveLength(1);
  });

  it.each(forEachLocale)('has exactly one h1 in %s', async (locale) => {
    await renderShell(name, locale);

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('keeps the h1 inside main', async () => {
    await renderShell(name);

    expect(
      within(screen.getByRole('main')).getByRole('heading', { level: 1 }),
    ).toBeInTheDocument();
  });

  it('orders landmarks header, main, footer', async () => {
    await renderShell(name);

    const banner = screen.getByRole('banner');
    const main = screen.getByRole('main');
    const footer = screen.getByRole('contentinfo');

    expect(precedes(banner, main)).toBe(true);
    expect(precedes(main, footer)).toBe(true);
  });

  it('puts the skip link first, then header, main and footer controls', async () => {
    const { container } = await renderShell(name);

    const order = tabbables(container);
    const skip = screen.getByRole('link', { name: en.Layout.skipLink });
    const banner = screen.getByRole('banner');
    const main = screen.getByRole('main');
    const footer = screen.getByRole('contentinfo');

    expect(order[0]).toBe(skip);
    const region = (element: HTMLElement) => {
      if (banner.contains(element)) return 1;
      if (main.contains(element)) return 2;
      if (footer.contains(element)) return 3;
      return 0;
    };
    const regions = order.map(region);
    expect(regions).toEqual([...regions].sort((a, b) => a - b));
    expect(regions).toContain(1);
    if (name === 'home') expect(regions).toContain(2);
  });

  it.each(forEachViewport)(
    'renders the same landmarks at %i px and at 200% zoom',
    async (width) => {
      const normal = await renderShell(name, 'en', width);
      const count = (attr: string) => screen.getAllByRole(attr).length;
      const expected = ['banner', 'main', 'contentinfo'].map(count);
      normal.unmount();

      await renderShell(name, 'en', width / 2);
      expect(['banner', 'main', 'contentinfo'].map(count)).toEqual(expected);
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    },
  );

  it.each(forEachLocale)('has no axe violations in %s', async (locale) => {
    const { container } = await renderShell(name, locale);

    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('skip link', () => {
  const layoutSource = readFileSync(
    resolve(import.meta.dirname, '../../app/[locale]/layout.tsx'),
    'utf8',
  );

  it.each(forEachLocale)(
    'points at the main landmark in %s',
    async (locale) => {
      await renderShell('home', locale);

      const skip = screen.getAllByRole('link')[0];
      const target = skip.getAttribute('href');

      expect(target).toBe(`#${MAIN_ID}`);
      expect(document.querySelector(target as string)).toBe(
        screen.getByRole('main'),
      );
    },
  );

  it('targets the id the locale layout puts on main', () => {
    expect(MAIN_ID).toBe('main');
    expect(layoutSource).not.toMatch(/const MAIN_ID/);
    expect(layoutSource).toMatch(/<main id=\{MAIN_ID\} tabIndex=\{-1\}>/);
    expect(layoutSource).toMatch(/<SkipLink \/>\s*<AppHeader \/>/);
  });
});
