import { expect, type Page, test } from '@playwright/test';
import { installMockApi, isLive, mockCredentials } from './mock-api';

type AdminRoute = { path: string; built: boolean };

const adminRoutes: AdminRoute[] = [
  { path: '', built: true },
  { path: '/account', built: true },
  { path: '/catalog/categories', built: true },
  { path: '/catalog/categories/1', built: true },
  { path: '/catalog/room-types', built: true },
  { path: '/catalog/room-types/BATHROOM', built: true },
  { path: '/catalog/material-types', built: true },
  { path: '/catalog/products', built: true },
  { path: '/catalog/products/new', built: true },
  { path: '/catalog/products/1', built: true },
  { path: '/styles', built: false },
  { path: '/styles/new', built: false },
  { path: '/styles/1', built: false },
  { path: '/engineering/package', built: false },
  { path: '/engineering/options', built: false },
  { path: '/options', built: false },
  { path: '/pricing/rules', built: false },
  { path: '/pricing/rules/new', built: false },
  { path: '/pricing/rules/1', built: false },
  { path: '/pricing/coefficients', built: false },
  { path: '/pricing/coefficients/1', built: false },
  { path: '/pricing/exchange-rate', built: false },
  { path: '/settings', built: false },
  { path: '/leads', built: false },
  { path: '/leads/1', built: false },
];

const builtRoutes = adminRoutes.filter(({ built }) => built);

const labels = {
  en: { signIn: 'Sign in', signOut: 'Sign out', demo: 'Sign in as demo' },
  uk: { signIn: 'Увійти', signOut: 'Вийти', demo: 'Увійти як демо' },
} as const;

const localeOf = (project: string) => (project === 'uk' ? 'uk' : 'en');
const adminPath = (locale: string, path: string) => `/${locale}/admin${path}`;

async function fillAndSubmit(
  page: Page,
  locale: 'en' | 'uk',
  credentials: { login: string; password: string },
) {
  const loginField = page.locator('input[autocomplete="username"]');
  await loginField.fill(credentials.login);
  await page.locator('input[type="password"]').fill(credentials.password);
  await page
    .getByRole('button', { name: labels[locale].signIn, exact: true })
    .click();
}

test.beforeEach(async ({ page }) => {
  test.skip(isLive(), 'relies on the mocked admin api');
  await installMockApi(page.context());
});

test.describe('without a session', () => {
  for (const { path, built } of adminRoutes) {
    test(`${adminPath('<locale>', path)} shows the login form`, async ({
      page,
    }, testInfo) => {
      test.fixme(!built, 'route is not built yet');
      const locale = localeOf(testInfo.project.name);
      await page.goto(adminPath(locale, path));
      await expect(page).toHaveURL(
        new RegExp(`/${locale}/admin/login\\?.*next=`),
      );
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(
        page.getByRole('button', { name: labels[locale].signIn, exact: true }),
      ).toBeVisible();
    });
  }
});

test('returns to the requested page after sign-in', async ({
  page,
}, testInfo) => {
  const locale = localeOf(testInfo.project.name);
  await page.goto(adminPath(locale, '/account'));
  await expect(page).toHaveURL(/\/admin\/login\?.*next=/);
  await fillAndSubmit(page, locale, mockCredentials.admin);
  await expect(page).toHaveURL(new RegExp(`${adminPath(locale, '/account')}$`));
  await expect(
    page.getByRole('button', { name: labels[locale].signOut }),
  ).toBeVisible();
});

test('does not show admin content after sign-out and Back', async ({
  page,
}, testInfo) => {
  const locale = localeOf(testInfo.project.name);
  await page.goto(adminPath(locale, '/login'));
  await fillAndSubmit(page, locale, mockCredentials.admin);
  await expect(page).toHaveURL(new RegExp(`${adminPath(locale, '')}/?$`));
  await page.goto(adminPath(locale, '/account'));
  const signOut = page.getByRole('button', { name: labels[locale].signOut });
  await signOut.click();
  await expect(page).toHaveURL(new RegExp(`${adminPath(locale, '/login')}`));
  await page.goBack();
  await expect(signOut).toHaveCount(0);
  await expect(page.locator('input[type="password"]')).toBeVisible();
});

test('signs in as the demo user in under 10 s and shows the banner everywhere', async ({
  page,
}, testInfo) => {
  const locale = localeOf(testInfo.project.name);
  const started = Date.now();
  await page.goto(adminPath(locale, '/login'));
  await page
    .getByRole('button', { name: labels[locale].demo, exact: true })
    .click();
  await page
    .getByRole('button', { name: labels[locale].signIn, exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: labels[locale].signOut }),
  ).toBeVisible();
  expect(Date.now() - started).toBeLessThan(10_000);

  for (const { path } of builtRoutes) {
    await page.goto(adminPath(locale, path));
    await expect(page.locator('[role="status"]').first()).toBeVisible();
    await expect(
      page.getByRole('status').filter({ hasText: /\d/ }),
    ).toHaveCount(1);
  }
});

test('keeps admin pages out of search engines', async ({
  page,
  request,
}, testInfo) => {
  const locale = localeOf(testInfo.project.name);

  const login = await request.get(adminPath(locale, '/login'));
  expect(login.headers()['x-robots-tag']).toContain('noindex');
  expect(login.headers()['cache-control']).toContain('no-store');

  await page.goto(adminPath(locale, '/login'));
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    /noindex/,
  );

  await page.goto(adminPath(locale, '/login'));
  await fillAndSubmit(page, locale, mockCredentials.admin);
  await expect(
    page.getByRole('button', { name: labels[locale].signOut }),
  ).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    /noindex/,
  );

  await expect(async () => {
    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toContain('Disallow: /en/admin');
    expect(robots).toContain('Disallow: /uk/admin');
  }).toPass();
});
