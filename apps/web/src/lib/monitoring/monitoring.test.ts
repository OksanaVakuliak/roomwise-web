import type { ErrorEvent, EventHint } from '@sentry/nextjs';
import { describe, expect, it } from 'vitest';
import { createSentryOptions, normalizeRoute, scrubEvent } from '.';

const DSN = 'https://public@o0.ingest.sentry.io/0';
const hint: EventHint = {};

function leakyEvent(): ErrorEvent {
  return {
    type: undefined,
    user: { id: '1', email: 'a@b.c', ip_address: '1.2.3.4' },
    request: {
      url: 'https://roomwise.test/uk/configurator?email=a@b.c',
      method: 'GET',
      query_string: 'email=a@b.c',
      cookies: { session: 'secret' },
      headers: { cookie: 'session=secret' },
      data: { phone: '123' },
    },
  };
}

describe('createSentryOptions', () => {
  it('is disabled without a DSN', () => {
    expect(createSentryOptions(undefined).enabled).toBe(false);
    expect(createSentryOptions('').enabled).toBe(false);
  });

  it('is enabled with a DSN and never sends default PII', () => {
    const options = createSentryOptions(DSN);
    expect(options.enabled).toBe(true);
    expect(options.dsn).toBe(DSN);
    expect(options.sendDefaultPii).toBe(false);
  });

  it('scrubs events through beforeSend', () => {
    const result = createSentryOptions(DSN).beforeSend(leakyEvent(), hint);
    expect(result.user).toBeUndefined();
  });
});

describe('message events', () => {
  it('keeps tags while dropping extra and user', () => {
    const event: ErrorEvent = {
      type: undefined,
      message: 'estimate-discrepancy',
      tags: { pricingVersion: 'v1', diffCents: 5, matched: false },
      extra: { configuration: { rooms: [] } },
      user: { id: '1' },
    };
    const result = createSentryOptions(DSN).beforeSend(event, hint);
    expect(result.tags).toMatchObject({
      pricingVersion: 'v1',
      diffCents: 5,
      matched: false,
    });
    expect(result.extra).toBeUndefined();
    expect(result.user).toBeUndefined();
  });
});

describe('beforeBreadcrumb', () => {
  const { beforeBreadcrumb } = createSentryOptions(DSN);

  it('drops console and input breadcrumbs', () => {
    expect(
      beforeBreadcrumb({ category: 'console', message: 'a@b.c' }),
    ).toBeNull();
    expect(
      beforeBreadcrumb({ category: 'ui.input', message: 'secret' }),
    ).toBeNull();
  });

  it('keeps only normalized pathnames in url, from and to', () => {
    const result = beforeBreadcrumb({
      category: 'navigation',
      data: {
        from: '/uk/estimate/3f9c2a7b1d8e4f60a1b2c3d4?email=a@b.c#top',
        to: 'https://roomwise.test/en/configurator?x=1',
        url: '/en/result#frag',
        status: 200,
      },
    });
    expect(result?.data).toEqual({
      from: '/uk/estimate/[id]',
      to: '/en/configurator',
      url: '/en/result',
      status: 200,
    });
  });
});

describe('normalizeRoute', () => {
  it('replaces dynamic segments with [id]', () => {
    expect(normalizeRoute('/uk/estimate/3f9c2a7b1d8e4f60a1b2c3d4')).toBe(
      '/uk/estimate/[id]',
    );
    expect(
      normalizeRoute('/en/estimate/3f9c2a7b-1d8e-4f60-a1b2-c3d4e5f60718'),
    ).toBe('/en/estimate/[id]');
    expect(normalizeRoute('/en/estimate/abc1234')).toBe('/en/estimate/[id]');
    expect(normalizeRoute('/en/estimate/abcdefghijklmnop')).toBe(
      '/en/estimate/[id]',
    );
  });

  it('keeps the locale and normal words', () => {
    expect(normalizeRoute('/en/configurator')).toBe('/en/configurator');
    expect(normalizeRoute('/uk/estimate')).toBe('/uk/estimate');
  });
});

describe('scrubEvent', () => {
  it('scrubs breadcrumbs and removes extra', () => {
    const result = scrubEvent({
      type: undefined,
      extra: { email: 'a@b.c' },
      breadcrumbs: [
        { category: 'console', message: 'a@b.c' },
        { category: 'fetch', data: { url: '/api/x?token=1' } },
      ],
    });
    expect(result.extra).toBeUndefined();
    expect(result.breadcrumbs).toEqual([
      { category: 'fetch', data: { url: '/api/x' } },
    ]);
  });

  it('normalizes the route tag and request url', () => {
    const result = scrubEvent({
      type: undefined,
      request: {
        url: 'https://roomwise.test/uk/estimate/3f9c2a7b1d8e4f60a1b2c3d4?x=1',
      },
    });
    expect(result.tags?.route).toBe('/uk/estimate/[id]');
    expect(result.request?.url).toBe('/uk/estimate/[id]');
  });

  it('removes user, ip, cookies, headers, body and query string', () => {
    const result = scrubEvent(leakyEvent());
    expect(result.user).toBeUndefined();
    expect(result.request?.cookies).toBeUndefined();
    expect(result.request?.headers).toBeUndefined();
    expect(result.request?.data).toBeUndefined();
    expect(result.request?.query_string).toBeUndefined();
    expect(JSON.stringify(result)).not.toMatch(/1\.2\.3\.4|secret|a@b\.c/);
  });

  it('tags locale and route from the request URL without the query string', () => {
    const result = scrubEvent(leakyEvent());
    expect(result.tags).toMatchObject({
      locale: 'uk',
      route: '/uk/configurator',
    });
    expect(result.request?.url).toBe('/uk/configurator');
  });

  it('tags the client context including viewport width', () => {
    const result = scrubEvent({ type: undefined }, () => ({
      pathname: '/en/result',
      locale: 'en',
      viewportWidth: 390,
    }));
    expect(result.tags).toEqual({
      route: '/en/result',
      locale: 'en',
      viewport_width: 390,
    });
  });

  it('keeps tags set elsewhere', () => {
    const result = scrubEvent({ type: undefined, tags: { step: 'room' } });
    expect(result.tags).toMatchObject({ step: 'room' });
  });
});
