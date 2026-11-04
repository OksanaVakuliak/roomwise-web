import { createHash } from 'node:crypto';
import type { BrowserContext, Route } from '@playwright/test';
import { createMockStore, type MockStore, routes } from './fixtures/routes';

const API_PREFIX = '/api/v1';

export const isLive = () => process.env.E2E_LIVE === '1';

export { createMockStore, type MockStore };

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
  if (method === 'POST') {
    if (!key) {
      await route.fulfill({
        status: 400,
        json: { error: { code: 'IDEMPOTENCY_KEY_REQUIRED' } },
      });
      return;
    }
    const replay = store.idempotent.get(key);
    if (replay) {
      await route.fulfill({ status: replay.status, json: replay.body });
      return;
    }
  }

  const reply = match.candidate.reply(match.found, {
    body: request.postDataJSON(),
    store,
    key,
  });
  const status = reply.status ?? 200;

  if (method === 'POST' && key && status < 300) {
    store.idempotent.set(key, reply);
  }

  if (!reply.etag) {
    await route.fulfill({ status, json: reply.body });
    return;
  }

  const etag = etagOf(JSON.stringify(reply.body));
  if (request.headers()['if-none-match'] === etag) {
    await route.fulfill({ status: 304, headers: { etag } });
    return;
  }
  await route.fulfill({ status, json: reply.body, headers: { etag } });
}

export async function installMockApi(
  context: BrowserContext,
  store: MockStore = createMockStore(),
): Promise<MockStore> {
  if (!isLive()) {
    await context.route('**/api/v1/**', (route) => answer(route, store));
  }
  return store;
}
