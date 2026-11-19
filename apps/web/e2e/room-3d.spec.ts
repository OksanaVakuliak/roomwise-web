import { expect, type Page, test } from '@playwright/test';
import { categoryIds, categoryNames, makeInteriorDraft } from '@/test/fixtures';
import { seedDraft } from './draft';
import {
  catalogs,
  escapeRegExp,
  type Locale,
  templateToRegExp,
} from './keyboard';
import { installMockApi, isLive } from './mock-api';

const THREE_MARKER = 'THREE.WebGLRenderer';
const ENGINE_DELAY_MS = 6_000;
const FEEDBACK_BUDGET_MS = 100;
const WITHOUT_WEBGL = 'falls back to the diagram without WebGL';

async function allowSoftwareWebGl(page: Page) {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function getContext(
      this: HTMLCanvasElement,
      type: string,
      options?: unknown,
    ) {
      if (type === 'webgl' || type === 'webgl2') {
        return original.call(this, type, {
          ...(options as WebGLContextAttributes | undefined),
          failIfMajorPerformanceCaveat: false,
        });
      }
      return original.call(this, type, options as never);
    } as typeof original;
  });
}

async function disableWebGl(page: Page) {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function getContext(
      this: HTMLCanvasElement,
      type: string,
      ...rest: unknown[]
    ) {
      if (type === 'webgl' || type === 'webgl2') {
        return null;
      }
      return (original as (...args: unknown[]) => unknown).call(
        this,
        type,
        ...rest,
      );
    } as typeof original;
  });
}

function trackEngineChunks(page: Page) {
  const engine = new Set<string>();
  const pending = new Set<Promise<void>>();
  page.on('response', (response) => {
    if (response.request().resourceType() !== 'script') {
      return;
    }
    const read = response
      .text()
      .then((body) => {
        if (body.includes(THREE_MARKER)) {
          engine.add(response.url());
        }
      })
      .catch(() => undefined)
      .finally(() => pending.delete(read));
    pending.add(read);
  });
  const settled = async () => {
    while (pending.size > 0) {
      await Promise.all([...pending]);
    }
  };
  return { engine, settled };
}

test.describe('room 3d preview', () => {
  test.skip(isLive(), 'relies on the mocked catalog');

  let locale: Locale;
  let preview: (typeof catalogs)['en']['RoomPreview'];

  test.beforeEach(async ({ page }) => {
    locale = test.info().project.name as Locale;
    preview = catalogs[locale].RoomPreview;
    await installMockApi(page.context());
    await seedDraft(page, makeInteriorDraft());
    if (test.info().title !== WITHOUT_WEBGL) {
      await allowSoftwareWebGl(page);
    }
  });

  test('shows the canvas and the view buttons respond', async ({ page }) => {
    await page.goto(`/${locale}/configurator/interior`);
    const reset = page.getByRole('button', { name: preview.reset });
    const top = page.getByRole('button', { name: preview.top });
    await expect(page.locator('canvas').first()).toBeVisible();
    await expect(reset).toBeEnabled();
    await expect(top).toBeEnabled();
    await top.click();
    await reset.click();
    await expect(page.locator('canvas').first()).toBeVisible();
    await expect(page.getByRole('button', { name: preview.retry })).toHaveCount(
      0,
    );
  });

  test('turning 3D off survives a reload', async ({ page }) => {
    await page.goto(`/${locale}/configurator/interior`);
    await page.getByRole('button', { name: preview.disable }).click();
    await expect(
      page.getByRole('button', { name: preview.enable }),
    ).toBeVisible();
    await expect(page.locator('canvas')).toHaveCount(0);
    await page.reload();
    await expect(
      page.getByRole('button', { name: preview.enable }),
    ).toBeVisible();
    await expect(page.locator('canvas')).toHaveCount(0);
  });

  test(WITHOUT_WEBGL, async ({ page }) => {
    await disableWebGl(page);
    await page.goto(`/${locale}/configurator/interior`);
    await expect(
      page.getByRole('button', { name: preview.disable }),
    ).toHaveCount(0);
    await expect(page.getByRole('button', { name: preview.reset })).toHaveCount(
      0,
    );
    await expect(page.locator('canvas')).toHaveCount(0);
    await expect(
      page.getByText(preview.fallback.unsupported).first(),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: preview.retry })).toHaveCount(
      0,
    );
  });

  test('the object step does not load the 3D engine', async ({ page }) => {
    const { engine, settled } = trackEngineChunks(page);
    await page.goto(`/${locale}/configurator/object`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.waitForLoadState('networkidle');
    await settled();
    expect([...engine]).toEqual([]);

    await page.goto(`/${locale}/configurator/interior`);
    await expect(page.locator('canvas').first()).toBeVisible();
    await expect.poll(() => engine.size).toBeGreaterThan(0);
  });

  test('choosing a product answers within 100 ms while the engine loads', async ({
    page,
  }) => {
    let released = false;
    const holds = new Set<() => void>();
    const release = () => {
      released = true;
      for (const resolve of holds) {
        resolve();
      }
    };
    await page.route('**/_next/static/**/*.js', async (route) => {
      try {
        const response = await route.fetch();
        const body = await response.text();
        if (!released && body.includes(THREE_MARKER)) {
          await new Promise<void>((resolve) => {
            holds.add(resolve);
            setTimeout(resolve, ENGINE_DELAY_MS);
          });
        }
        await route.fulfill({ response, body });
      } catch {
        await route.abort().catch(() => undefined);
      }
    });

    await page.goto(`/${locale}/configurator/interior`);
    const messages = catalogs[locale];
    const loading = page.getByRole('status', { name: preview.loading });
    await expect(loading).toBeVisible();

    await page
      .getByRole('button', {
        name: new RegExp(`^${escapeRegExp(categoryNames[categoryIds.floor])}`),
      })
      .first()
      .click();
    const candidate = page
      .getByRole('dialog')
      .getByRole('button', {
        name: templateToRegExp(messages.ProductShowcase.chooseLabel),
        pressed: false,
      })
      .first();
    await expect(candidate).toBeVisible();
    await expect(loading).toBeVisible();
    const label = (await candidate.getAttribute('aria-label')) as string;
    await page.evaluate((name) => {
      const win = window as Window & { feedbackMs?: number };
      let started = 0;
      const find = () =>
        [...document.querySelectorAll('[role="dialog"] button')].find(
          (button) => button.getAttribute('aria-label') === name,
        );
      document.addEventListener(
        'click',
        (event) => {
          const target = event.target as Element | null;
          if (target?.closest('button')?.getAttribute('aria-label') === name) {
            started = performance.now();
          }
        },
        { capture: true },
      );
      new MutationObserver(() => {
        const button = find();
        if (
          win.feedbackMs === undefined &&
          started > 0 &&
          (button === undefined ||
            button.getAttribute('aria-pressed') === 'true')
        ) {
          win.feedbackMs = performance.now() - started;
        }
      }).observe(document.body, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['aria-pressed'],
      });
    }, label);
    await candidate.click();
    await page.waitForFunction(
      () =>
        (window as Window & { feedbackMs?: number }).feedbackMs !== undefined,
    );
    const elapsed = await page.evaluate(
      () => (window as Window & { feedbackMs?: number }).feedbackMs,
    );
    release();
    await page.unrouteAll({ behavior: 'ignoreErrors' });

    expect(elapsed).toBeDefined();
    expect(elapsed as number).toBeLessThan(FEEDBACK_BUDGET_MS);
    test.info().annotations.push({
      type: 'feedback-ms',
      description: String(elapsed),
    });
    console.log(`SC-003 feedback ${locale}: ${elapsed} ms`);
  });
});
