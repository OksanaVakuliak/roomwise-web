import type { ErrorEvent, EventHint } from '@sentry/nextjs';
import { describe, expect, it } from 'vitest';
import { createSentryOptions, scrubEvent } from '.';

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

describe('scrubEvent', () => {
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
