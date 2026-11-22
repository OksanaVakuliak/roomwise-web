import { createHash } from 'node:crypto';
import type { BrowserContext, Page, Request, Route } from '@playwright/test';
import {
  SESSION_COOKIE,
  type Session,
  sessionFromCookie,
  sessionValue,
} from './fixtures/admin-routes';
import {
  createMockStore,
  type MockStore,
  routes,
  TEXTURE_ORIGIN,
} from './fixtures/routes';
import { TEXTURE_PNG } from './fixtures/texture';

const API_PREFIX = '/api/v1';

export const isLive = () => process.env.E2E_LIVE === '1';

export { addMockLead, mockCredentials } from './fixtures/admin-routes';
export { createMockStore, type MockStore };

export async function loginAs(page: Page, role: Session) {
  await page.context().addCookies([
    {
      name: SESSION_COOKIE,
      value: sessionValue(role),
      domain: 'localhost',
      path: '/api',
    },
  ]);
}

const parseBody = (request: Request): unknown => {
  try {
    return request.postDataJSON();
  } catch {
    return null;
  }
};

const etagOf = (payload: string) =>
  `"${createHash('sha1').update(payload).digest('hex')}"`;

async function answer(route: Route, store: MockStore) {
  const request = route.request();
  const url = new URL(request.url());
  const path = url.pathname.startsWith(API_PREFIX)
    ? url.pathname.slice(API_PREFIX.length)
    : url.pathname;
  const method = request.method();

  const match = routes
    .filter((candidate) => candidate.method === method)
    .map((candidate) => ({ candidate, found: path.match(candidate.pattern) }))
    .find(({ found }) => found !== null);

  if (!match?.found) {
    await route.fulfill({
      status: 404,
      json: { error: { code: 'NOT_FOUND' } },
    });
    return;
  }

  const key = request.headers()['idempotency-key'] ?? null;
  const idempotent = method === 'POST' && path.startsWith('/public/');
  if (idempotent) {
    if (!key) {
      await route.fulfill({
        status: 400,
        json: { error: { code: 'IDEMPOTENCY_KEY_REQUIRED' } },
      });
      return;
    }
    const replay = store.idempotent.get(key);
    if (replay) {
      await route.fulfill({
        status: replay.status,
        json: replay.body,
        headers: replay.headers,
      });
      return;
    }
  }

  const session = sessionFromCookie((await request.allHeaders()).cookie);
  const reply = match.candidate.reply(match.found, {
    store,
    url,
    body: parseBody(request),
    raw: request.postDataBuffer()?.toString('latin1') ?? null,
    session,
  });
  const status = reply.status ?? 200;

  if (idempotent && key && status < 300) {
    store.idempotent.set(key, reply);
  }

  if (reply.body === undefined) {
    await route.fulfill({ status, headers: reply.headers });
    return;
  }

  if (!reply.etag) {
    await route.fulfill({ status, json: reply.body, headers: reply.headers });
    return;
  }

  const etag = etagOf(JSON.stringify(reply.body));
  if (request.headers()['if-none-match'] === etag) {
    await route.fulfill({ status: 304, headers: { ...reply.headers, etag } });
    return;
  }
  await route.fulfill({
    status,
    json: reply.body,
    headers: { ...reply.headers, etag },
  });
}

export async function installMockApi(
  context: BrowserContext,
  store: MockStore = createMockStore(),
): Promise<MockStore> {
  if (!isLive()) {
    await context.route('**/api/v1/**', (route) => answer(route, store));
    await context.route(`${TEXTURE_ORIGIN}/**`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'image/png',
        headers: { 'access-control-allow-origin': '*' },
        body: TEXTURE_PNG,
      }),
    );
  }
  return store;
}
