import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, screen, within } from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import {
  forEachLocale,
  forEachTheme,
  renderWithProviders,
} from '@/test/render-with-providers';
import { setViewport } from '@/test/viewports';
import en from '../../../../../messages/en.json';
import uk from '../../../../../messages/uk.json';
import { Showcase } from './Showcase';
import { SHOWCASE_SECTIONS } from './sections';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={`/en${href}`} {...rest} />
  ),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => '/showcase',
}));

const NAMESPACES = [
  'Showcase',
  'ShowcaseTokens',
  'ShowcaseHeader',
  'ShowcaseStepTape',
  'ShowcaseActions',
  'ShowcaseFormFields',
  'ShowcaseRoomPlan',
  'ShowcaseSectionCut',
  'ShowcaseDataDisplay',
  'ShowcaseSpecification',
  'ShowcaseOverlays',
  'ShowcaseEstimate',
  'ShowcaseSystemStates',
] as const;

const MOBILE_WIDTH = 390;
const TIMEOUT = 180_000;

const catalogs = { en, uk } as const;

const styleModules = import.meta.glob('./**/*.module.css', {
  eager: true,
  import: 'default',
}) as Record<string, Record<string, string>>;
const styleSources = Object.fromEntries(
  Object.keys(styleModules).map((file) => [
    file,
    readFileSync(resolve(import.meta.dirname, file), 'utf8'),
  ]),
);

function leaves(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value];
  }
  if (value && typeof value === 'object') {
    return Object.values(value).flatMap(leaves);
  }
  return [];
}

function namespaceStrings(locale: 'en' | 'uk'): string[] {
  const catalog = catalogs[locale];
  return NAMESPACES.flatMap((namespace) => leaves(catalog[namespace]));
}

function visibleText(container: HTMLElement): string {
  const labels = [
    ...container.querySelectorAll('[aria-label], [title]'),
  ].flatMap((node) => [
    node.getAttribute('aria-label'),
    node.getAttribute('title'),
  ]);
  return [
    (container.textContent ?? '').replace(/--[\w-]+/g, ''),
    ...labels,
  ].join('\n');
}

type ClassRule = { file: string; names: string[]; selfSafe: boolean };

function pxValue(raw: string | undefined): number {
  const match = /^([\d.]+)(px|rem)$/.exec((raw ?? '').trim());
  if (!match) {
    return 0;
  }
  return Number(match[1]) * (match[2] === 'rem' ? 16 : 1);
}

function stripMedia(css: string): string {
  let out = '';
  let index = 0;
  while (index < css.length) {
    const media = css.indexOf('@media', index);
    if (media === -1) {
      out += css.slice(index);
      break;
    }
    out += css.slice(index, media);
    let depth = 0;
    let cursor = css.indexOf('{', media);
    while (cursor < css.length) {
      if (css[cursor] === '{') {
        depth += 1;
      } else if (css[cursor] === '}') {
        depth -= 1;
        if (depth === 0) {
          break;
        }
      }
      cursor += 1;
    }
    index = cursor + 1;
  }
  return out;
}

function parseRules(source: string) {
  const css = stripMedia(source.replace(/\/\*[\s\S]*?\*\//g, ''));
  const rules: { selectors: string[][]; body: string }[] = [];
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectors = match[1]
      .split(',')
      .map((selector) =>
        [...selector.matchAll(/\.([\w-]+)/g)].map((item) => item[1]),
      )
      .filter((names) => names.length > 0);
    rules.push({ selectors, body: match[2] });
  }
  return rules;
}

function declaration(body: string, property: string): string | undefined {
  const match = new RegExp(`(?:^|[;\\s])${property}\\s*:\\s*([^;]+)`).exec(
    body,
  );
  return match?.[1].trim();
}

function collectLayoutRules() {
  const fixed: ClassRule[] = [];
  const scrollers: ClassRule[] = [];
  for (const [file, source] of Object.entries(styleSources)) {
    for (const { selectors, body } of parseRules(source)) {
      const width = Math.max(
        pxValue(declaration(body, 'width')),
        pxValue(declaration(body, 'min-width')),
      );
      const overflowX = declaration(body, 'overflow-x');
      const selfSafe = declaration(body, 'max-width') === '100%';
      for (const names of selectors) {
        if (width > MOBILE_WIDTH) {
          fixed.push({ file, names, selfSafe });
        }
        if (overflowX === 'auto' || overflowX === 'scroll') {
          scrollers.push({ file, names, selfSafe });
        }
      }
    }
  }
  return { fixed, scrollers };
}

function toSelector({ file, names }: ClassRule): string {
  const classes = names.map((name) => styleModules[file]?.[name]);
  if (classes.some((value) => !value)) {
    return '';
  }
  return classes.map((value) => `.${CSS.escape(value)}`).join('');
}

afterEach(() => {
  cleanup();
});

describe('Showcase', () => {
  describe.each(forEachLocale)('locale %s', (locale) => {
    describe.each(forEachTheme)('theme %s', (theme) => {
      it(
        'renders every declared section with its title and nav link',
        () => {
          renderWithProviders(<Showcase />, { locale, theme });
          const titles = catalogs[locale].Showcase.sections;
          const nav = screen.getByRole('navigation', {
            name: catalogs[locale].Showcase.navLabel,
          });

          for (const id of SHOWCASE_SECTIONS) {
            const region = screen.getByRole('region', { name: titles[id] });
            expect(region).toHaveAttribute('id', id);
            expect(region.tagName).toBe('SECTION');
            expect(
              within(nav).getByRole('link', { name: titles[id] }),
            ).toHaveAttribute('href', `#${id}`);
          }
          expect(document.querySelectorAll('section[id]')).toHaveLength(
            SHOWCASE_SECTIONS.length,
          );
        },
        TIMEOUT,
      );

      it(
        'has unique element ids',
        () => {
          const { container } = renderWithProviders(<Showcase />, {
            locale,
            theme,
          });
          const ids = [...container.querySelectorAll('[id]')].map(
            (node) => node.id,
          );
          expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
        },
        TIMEOUT,
      );

      it(
        'has no axe violations',
        async () => {
          const { container } = renderWithProviders(<Showcase />, {
            locale,
            theme,
          });
          expect(await axe(container)).toHaveNoViolations();
        },
        TIMEOUT,
      );
    });
  });

  it(
    'switches every translated caption from English to Ukrainian',
    () => {
      const { container, unmount } = renderWithProviders(<Showcase />, {
        locale: 'en',
      });
      const englishText = visibleText(container);
      unmount();

      const ukrainian = renderWithProviders(<Showcase />, { locale: 'uk' });
      const ukrainianText = visibleText(ukrainian.container);

      const english = namespaceStrings('en');
      const translated = namespaceStrings('uk');
      const pairs = english
        .map((value, index) => [value, translated[index]] as const)
        .filter(
          ([source, target]) =>
            source !== target &&
            source.length >= 5 &&
            !/[{}<>]/.test(source) &&
            !translated.includes(source),
        );

      const rendered = pairs.filter(([source]) => englishText.includes(source));
      expect(rendered.length).toBeGreaterThan(20);

      const leaked = rendered
        .map(([source]) => source)
        .filter((source) => ukrainianText.includes(source));
      expect(leaked).toEqual([]);

      const missing = rendered
        .map(([, target]) => target)
        .filter((target) => !ukrainianText.includes(target));
      expect(missing).toEqual([]);
    },
    TIMEOUT,
  );

  it(
    'keeps fixed widths above 390px inside a horizontal scroller at that viewport',
    () => {
      setViewport(MOBILE_WIDTH);
      const { container } = renderWithProviders(<Showcase />);
      const { fixed, scrollers } = collectLayoutRules();
      expect(fixed.length).toBeGreaterThan(0);
      expect(scrollers.length).toBeGreaterThan(0);

      const scrollerSelector = scrollers
        .map(toSelector)
        .filter(Boolean)
        .join(',');

      const unsafe: string[] = [];
      for (const rule of fixed) {
        const selector = toSelector(rule);
        if (!selector || rule.selfSafe) {
          continue;
        }
        for (const element of container.querySelectorAll(selector)) {
          if (!element.parentElement?.closest(scrollerSelector)) {
            unsafe.push(`${rule.file} .${rule.names.join('.')}`);
          }
        }
      }
      expect([...new Set(unsafe)]).toEqual([]);
    },
    TIMEOUT,
  );
});
