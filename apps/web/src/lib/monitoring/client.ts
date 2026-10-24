import { createSentryOptions, readBrowserContext } from '.';

type SentryModule = typeof import('@sentry/nextjs');

const IDLE_TIMEOUT_MS = 5000;
const FALLBACK_DELAY_MS = 1;

let ready: Promise<SentryModule | null> | null = null;
let loaded: SentryModule | null = null;

function start(): Promise<SentryModule | null> | null {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return null;
  ready ??= import('@sentry/nextjs')
    .then((sentry) => {
      sentry.init(
        createSentryOptions(
          process.env.NEXT_PUBLIC_SENTRY_DSN,
          readBrowserContext,
        ),
      );
      loaded = sentry;
      return sentry;
    })
    .catch(() => {
      ready = null;
      return null;
    });
  return ready;
}

function whenIdle(task: () => void) {
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(task, { timeout: IDLE_TIMEOUT_MS });
  } else {
    setTimeout(task, FALLBACK_DELAY_MS);
  }
}

export function initMonitoring() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  const begin = () => whenIdle(() => void start());
  if (document.readyState === 'complete') {
    begin();
  } else {
    window.addEventListener('load', begin, { once: true });
  }
}

export function captureException(error: unknown) {
  void start()?.then((sentry) => sentry?.captureException(error));
}

export function captureRouterTransition(href: string, navigationType: string) {
  loaded?.captureRouterTransitionStart(href, navigationType);
}
