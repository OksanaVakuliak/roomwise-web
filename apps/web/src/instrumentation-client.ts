import * as Sentry from '@sentry/nextjs';
import { createSentryOptions, readBrowserContext } from '@/lib/monitoring';

Sentry.init(
  createSentryOptions(process.env.NEXT_PUBLIC_SENTRY_DSN, readBrowserContext),
);

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
