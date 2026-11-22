import { expect, type Page, test } from '@playwright/test';
import { adminIds } from '@/test/fixtures';
import { installMockApi, isLive, loginAs, mockCredentials } from './mock-api';

type Call<T> = { status: number; body: T };
type Pair = { productId: string | null; state: string };

async function call<T = null>(
  page: Page,
  method: string,
  path: string,
  body?: unknown,
): Promise<Call<T>> {
  return page.evaluate(
    async ({ method, path, body }) => {
      const response = await fetch(`/api/v1${path}`, {
        method,
        headers: {
          'content-type': 'application/json',
          'idempotency-key': crypto.randomUUID(),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const text = await response.text();
      return {
        status: response.status,
        body: text ? JSON.parse(text) : null,
      };
    },
    { method, path, body },
  );
}

test.beforeEach(async ({ page }) => {
  test.skip(isLive(), 'relies on the mocked admin api');
  await installMockApi(page.context());
  await page.goto('/');
});

test('answers admin requests only for a signed-in session', async ({
  page,
}) => {
  expect((await call(page, 'GET', '/admin/auth/me')).status).toBe(401);
  await loginAs(page, 'admin');
  expect((await call(page, 'GET', '/admin/auth/me')).status).toBe(200);
});

test('signs in as the demo user and forbids password changes', async ({
  page,
}) => {
  const login = await call(
    page,
    'POST',
    '/admin/auth/login',
    mockCredentials.demo,
  );
  expect(login.status).toBe(200);
  const me = await call<{ isDemo: boolean }>(page, 'GET', '/admin/auth/me');
  expect(me.body.isDemo).toBe(true);
  const password = await call<{ error: { code: string } }>(
    page,
    'POST',
    '/admin/auth/password',
    {
      currentPassword: mockCredentials.admin.password,
      newPassword: 'another-password',
    },
  );
  expect(password.status).toBe(403);
  expect(password.body.error.code).toBe('DEMO_FORBIDDEN');
});

test('shows a public lead in the admin leads list', async ({ page }) => {
  await loginAs(page, 'admin');
  const created = await call<{ leadNumber: number }>(
    page,
    'POST',
    '/public/leads',
    {
      name: 'Mock Client',
      phone: '+380 50 000 00 00',
      email: '',
      locale: 'uk',
      consent: { accepted: true, text: 'I agree' },
    },
  );
  const { leadNumber } = created.body;
  const found = await call<{ items: Record<string, unknown>[] }>(
    page,
    'GET',
    `/admin/leads?q=${leadNumber}`,
  );
  expect(found.body.items).toHaveLength(1);
  expect(found.body.items[0]).toMatchObject({
    number: leadNumber,
    name: 'Mock Client',
    email: null,
  });
});

test('marks a style pair unavailable after archiving its product', async ({
  page,
}) => {
  await loginAs(page, 'admin');
  const stateOfPair = async () => {
    const style = await call<{ pairs: Pair[] }>(
      page,
      'GET',
      `/admin/styles/${adminIds.styles.modern}`,
    );
    return style.body.pairs.find(
      (pair) => pair.productId === adminIds.products.inStyle,
    )?.state;
  };
  expect(await stateOfPair()).toBe('FILLED');
  const product = await call<{ revision: string }>(
    page,
    'GET',
    `/admin/products/${adminIds.products.inStyle}`,
  );
  const archived = await call(
    page,
    'POST',
    `/admin/products/${adminIds.products.inStyle}/status`,
    { status: 'ARCHIVED', revision: product.body.revision },
  );
  expect(archived.status).toBe(200);
  expect(await stateOfPair()).toBe('PRODUCT_UNAVAILABLE');
});
