import { defaultCache } from '@serwist/turbopack/worker';
import { NetworkOnly } from 'serwist';
import { describe, expect, it } from 'vitest';
import {
  fallbacks,
  OFFLINE_URL,
  precacheEntries,
  uncachedRule,
  withUncachedRoutes,
  workerOptions,
} from '@/lib/pwa';

type Matcher = (options: {
  request: Request;
  url: URL;
  sameOrigin: boolean;
}) => boolean;

function context(url: string, origin = 'https://roomwise.app') {
  const parsed = new URL(url, origin);
  return {
    request: new Request(parsed),
    url: parsed,
    sameOrigin: parsed.origin === origin,
  };
}

function handlerFor(url: string) {
  const entry = withUncachedRoutes(defaultCache).find((rule) => {
    const matcher = rule.matcher as Matcher | RegExp;
    const target = context(url);
    return typeof matcher === 'function'
      ? matcher(target)
      : matcher.test(target.url.href);
  });
  return entry?.handler;
}

describe('service worker config', () => {
  it('takes control without waiting', () => {
    expect(workerOptions.skipWaiting).toBe(true);
    expect(workerOptions.clientsClaim).toBe(true);
  });

  it('falls back to the offline page for documents only', () => {
    const [entry] = fallbacks.entries;
    expect(entry.url).toBe(OFFLINE_URL);
    expect(OFFLINE_URL).toBe('/~offline');
    expect(
      entry.matcher({ request: { destination: 'document' } as Request }),
    ).toBe(true);
    expect(
      entry.matcher({ request: { destination: 'image' } as Request }),
    ).toBe(false);
  });

  it.each([
    '/api/rooms',
    '/api/catalog/items?page=2',
    '/api/auth/session',
    '/admin',
    '/admin/prices',
    '/uk/admin',
    '/en/admin/leads',
  ])('never caches %s', (path) => {
    expect(handlerFor(path)).toBeInstanceOf(NetworkOnly);
  });

  it('puts the API rule before the defaults', () => {
    const rules = withUncachedRoutes(defaultCache);
    expect(rules[0].handler).toBeInstanceOf(NetworkOnly);
    expect(rules.slice(1)).toEqual(defaultCache);
  });

  it('leaves other requests to the defaults', () => {
    expect(handlerFor('/uk/configurator')).not.toBe(uncachedRule.handler);
  });

  it.each(['/administrators', '/uk/administrators', '/uk/configurator/admin'])(
    'leaves %s to the defaults',
    (path) => {
      expect(handlerFor(path)).not.toBe(uncachedRule.handler);
    },
  );

  it('precaches the same URL it falls back to', () => {
    const [entry] = precacheEntries('rev');
    expect(entry).toEqual({ url: OFFLINE_URL, revision: 'rev' });
    expect(fallbacks.entries[0].url).toBe(entry.url);
  });

  it('does not match another origin', () => {
    const rule = withUncachedRoutes([])[0];
    expect(
      (rule.matcher as Matcher)(context('https://other.example/api/rooms')),
    ).toBe(false);
  });
});
