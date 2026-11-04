import { expect, type Page, test } from '@playwright/test';
import { DRAFT_STORAGE_KEY } from '@/stores/draft';
import {
  calculationIds,
  makeDraftRoom,
  makeFullRoomsDraft,
  makeVersionView,
} from '@/test/fixtures';
import { createMockStore, installMockApi } from './mock-api';

const DRAFT_VERSION = 2;
const THEME_STORAGE_KEY = 'roomwise-theme';
const NARROW = { width: 320, height: 640 };
const LONG_NAME = 'Extra long room name that fills the whole field width';

const pages = [
  { name: 'object', path: '/configurator/object' },
  { name: 'engineering', path: '/configurator/engineering' },
  { name: 'style', path: '/configurator/style' },
  { name: 'interior', path: '/configurator/interior' },
  { name: 'result', path: '/configurator/result' },
  { name: 'snapshot', path: `/calculations/${calculationIds.publicId}` },
] as const;

const themes = ['light', 'dark'] as const;

const modes = [
  { name: '320px', textScale: '100%', fontPx: '16px' },
  { name: '320px at 200% text', textScale: '200%', fontPx: '32px' },
] as const;

const extremeDraft = () => {
  const draft = makeFullRoomsDraft({
    step: 'result',
    furthestStep: 'result',
  });
  return {
    ...draft,
    object: { ...draft.object, totalAreaSqm: 9_999_999 },
    rooms: draft.rooms.map((room, index) =>
      makeDraftRoom({
        ...room,
        name: `${index + 1}. ${LONG_NAME}`,
        lengthM: 999_999,
        widthM: 999_999,
        heightM: 99_999,
      }),
    ),
  };
};

async function seed(
  page: Page,
  theme: (typeof themes)[number],
  draft: ReturnType<typeof extremeDraft>,
) {
  await page.addInitScript(
    ([themeKey, mode, draftKey, persisted]) => {
      window.localStorage.setItem(themeKey, mode);
      window.localStorage.setItem(draftKey, persisted);
    },
    [
      THEME_STORAGE_KEY,
      theme,
      DRAFT_STORAGE_KEY,
      JSON.stringify({ state: draft, version: DRAFT_VERSION }),
    ] as const,
  );
}

async function overflowOf(page: Page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const limit = root.clientWidth;
    const offenders = [...document.body.querySelectorAll('*')]
      .map((element) => ({
        element,
        right: Math.round(element.getBoundingClientRect().right),
      }))
      .filter(({ right }) => right > limit)
      .slice(0, 5)
      .map(
        ({ element, right }) =>
          `${element.tagName.toLowerCase()}.${String(element.className).slice(0, 60)} right=${right}`,
      );
    const clipped = [...document.body.querySelectorAll('*')]
      .filter((element) => {
        const { overflowX } = getComputedStyle(element);
        return (
          (overflowX === 'hidden' || overflowX === 'clip') &&
          element.tagName !== 'INPUT' &&
          element.clientWidth > 1 &&
          element.scrollWidth > element.clientWidth + 1
        );
      })
      .slice(0, 5)
      .map(
        (element) =>
          `${element.tagName.toLowerCase()}.${String(element.className).slice(0, 60)}`,
      );
    return {
      scrollWidth: root.scrollWidth,
      clientWidth: limit,
      offenders,
      clipped,
    };
  });
}

for (const theme of themes) {
  for (const mode of modes) {
    for (const target of pages) {
      test(`${target.name} in ${theme} theme has no horizontal overflow at ${mode.name}`, async ({
        page,
      }) => {
        const locale = test.info().project.name;
        const store = createMockStore();
        store.calculations.set(calculationIds.publicId, makeVersionView());
        await installMockApi(page.context(), store);
        await seed(page, theme, extremeDraft());
        await page.setViewportSize(NARROW);

        await page.goto(`/${locale}${target.path}`);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        await page.waitForLoadState('networkidle');
        await page.addStyleTag({
          content: `html { font-size: ${mode.textScale}; }`,
        });
        await expect(page.locator('html')).toHaveCSS('font-size', mode.fontPx);

        const { scrollWidth, clientWidth, offenders, clipped } =
          await overflowOf(page);
        expect(
          scrollWidth,
          `overflowing elements: ${offenders.join('; ')}`,
        ).toBeLessThanOrEqual(clientWidth);
        expect(clipped, 'content clipped by overflow').toEqual([]);
      });
    }
  }
}
