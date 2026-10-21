import * as Sentry from '@sentry/nextjs';
import { createSentryOptions } from '@/lib/monitoring';

export function register() {
  Sentry.init(createSentryOptions(process.env.SENTRY_DSN));
}

export const onRequestError = Sentry.captureRequestError;
