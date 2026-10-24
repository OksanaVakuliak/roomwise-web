import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { MessageOptions } from './client';

const DSN = 'https://public@o0.ingest.sentry.io/0';

const sentry = vi.hoisted(() => ({
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  captureRouterTransitionStart: vi.fn(),
}));

vi.mock('@sentry/nextjs', () => sentry);

const options: MessageOptions = {
  level: 'error',
  fingerprint: ['estimate-discrepancy'],
  tags: { pricingVersion: 'v1', diffCents: 5, matched: false },
};

async function loadClient() {
  vi.resetModules();
  return import('./client');
}

async function flush() {
  await vi.advanceTimersByTimeAsync(10);
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  Object.defineProperty(document, 'readyState', {
    configurable: true,
    value: 'complete',
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe('without a DSN', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', '');
  });

  it('never loads or initializes Sentry', async () => {
    const client = await loadClient();
    client.initMonitoring();
    client.captureException(new Error('boom'));
    client.captureMessage('estimate-discrepancy', options);
    client.captureRouterTransition('/uk', 'push');
    await flush();
    expect(sentry.init).not.toHaveBeenCalled();
    expect(sentry.captureException).not.toHaveBeenCalled();
    expect(sentry.captureMessage).not.toHaveBeenCalled();
    expect(sentry.captureRouterTransitionStart).not.toHaveBeenCalled();
  });
});

describe('with a DSN', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', DSN);
  });

  it('initializes Sentry after the page is idle with the scrubbing options', async () => {
    const client = await loadClient();
    client.initMonitoring();
    expect(sentry.init).not.toHaveBeenCalled();
    await flush();
    expect(sentry.init).toHaveBeenCalledOnce();
    expect(sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: DSN,
        enabled: true,
        sendDefaultPii: false,
        beforeSend: expect.any(Function),
        beforeBreadcrumb: expect.any(Function),
      }),
    );
  });

  it('waits for the load event when the page is still loading', async () => {
    Object.defineProperty(document, 'readyState', {
      configurable: true,
      value: 'loading',
    });
    const client = await loadClient();
    client.initMonitoring();
    await flush();
    expect(sentry.init).not.toHaveBeenCalled();
    window.dispatchEvent(new Event('load'));
    await flush();
    expect(sentry.init).toHaveBeenCalledOnce();
  });

  it('forwards router transitions only once Sentry is loaded', async () => {
    const client = await loadClient();
    client.initMonitoring();
    client.captureRouterTransition('/uk', 'push');
    expect(sentry.captureRouterTransitionStart).not.toHaveBeenCalled();
    await flush();
    client.captureRouterTransition('/uk/estimate', 'push');
    expect(sentry.captureRouterTransitionStart).toHaveBeenCalledWith(
      '/uk/estimate',
      'push',
    );
  });

  it('loads and initializes on demand when capturing an exception', async () => {
    const client = await loadClient();
    const error = new Error('boom');
    client.captureException(error);
    await flush();
    expect(sentry.init).toHaveBeenCalledOnce();
    expect(sentry.captureException).toHaveBeenCalledWith(error);
    expect(sentry.init.mock.invocationCallOrder[0]).toBeLessThan(
      sentry.captureException.mock.invocationCallOrder[0],
    );
  });

  it('loads and initializes on demand when capturing a message', async () => {
    const client = await loadClient();
    client.captureMessage('estimate-discrepancy', options);
    await flush();
    expect(sentry.init).toHaveBeenCalledOnce();
    expect(sentry.captureMessage).toHaveBeenCalledWith(
      'estimate-discrepancy',
      options,
    );
  });

  it('retries loading Sentry after a failed start without an unhandled rejection', async () => {
    sentry.init.mockImplementationOnce(() => {
      throw new Error('chunk failed');
    });
    const client = await loadClient();
    client.captureException(new Error('first'));
    await flush();
    expect(sentry.captureException).not.toHaveBeenCalled();
    client.captureException(new Error('second'));
    await flush();
    expect(sentry.init).toHaveBeenCalledTimes(2);
    expect(sentry.captureException).toHaveBeenCalledOnce();
  });
});
