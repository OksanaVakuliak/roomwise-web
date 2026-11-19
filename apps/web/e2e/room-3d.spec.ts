import { expect, type Page, test } from '@playwright/test';
import { DRAFT_VERSION } from '@/lib/draft/migrate';
import { makeInteriorDraft } from '@/test/fixtures';
import { catalogs, type Locale, templateToRegExp } from './keyboard';
import { installMockApi } from './mock-api';

const DRAFT_KEY = 'roomwise-draft';
const THREE_MARKER = 'THREE.WebGLRenderer';
const ENGINE_DELAY_MS = 6_000;
const FEEDBACK_BUDGET_MS = 100;

async function seedDraft(page: Page) {
  await page.addInitScript(
    ([key, value]) => {
      if (!window.localStorage.getItem(key)) {
        window.localStorage.setItem(key, value);
      }
    },
    [
      DRAFT_KEY,
      JSON.stringify({ state: makeInteriorDraft(), version: DRAFT_VERSION }),
    ],
  );
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
  page.on('response', async (response) => {
    if (response.request().resourceType() !== 'script') {
      return;
    }
    try {
      if ((await response.text()).includes(THREE_MARKER)) {
        engine.add(response.url());
      }
    } catch {
      return;
    }
  });
  return engine;
}

test.describe('room 3d preview', () => {
  let locale: Locale;
  let preview: (typeof catalogs)['en']['RoomPreview'];

  test.beforeEach(async ({ page }) => {
    locale = test.info().project.name as Locale;
    preview = catalogs[locale].RoomPreview;
    await installMockApi(page.context());
    await seedDraft(page);
  });

  test('shows the canvas and the view buttons work', async ({ page }) => {
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

  test('falls back to the diagram without WebGL', async ({ page }) => {
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
    const engine = trackEngineChunks(page);
    await page.goto(`/${locale}/configurator/object`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.waitForLoadState('networkidle');
    expect([...engine]).toEqual([]);

    await page.goto(`/${locale}/configurator/interior`);
    await expect(page.locator('canvas').first()).toBeVisible();
    expect(engine.size).toBeGreaterThan(0);
  });

  test('choosing a product answers within 100 ms while the engine loads', async ({
    page,
  }) => {
    let released = false;
    await page.route('**/_next/static/**/*.js', async (route) => {
      try {
        const response = await route.fetch();
        const body = await response.text();
        if (!released && body.includes(THREE_MARKER)) {
          await new Promise((resolve) => setTimeout(resolve, ENGINE_DELAY_MS));
        }
        await route.fulfill({ response, body });
      } catch {
        await route.abort();
      }
    });

    await page.goto(`/${locale}/configurator/interior`);
    const messages = catalogs[locale];
    const loading = page.getByRole('status', { name: preview.loading });
    await expect(loading).toBeVisible();

    await page
      .getByRole('region')
      .getByRole('list')
      .first()
      .getByRole('button')
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
      find()?.addEventListener(
        'click',
        () => {
          started = performance.now();
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
    released = true;

    expect(elapsed).toBeDefined();
    expect(elapsed as number).toBeLessThan(FEEDBACK_BUDGET_MS);
    test.info().annotations.push({
      type: 'feedback-ms',
      description: String(elapsed),
    });
    console.log(`SC-003 feedback ${locale}: ${elapsed} ms`);
  });
});
