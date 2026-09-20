import { z } from 'zod';

const NEXT_PUBLIC_SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const NEXT_PUBLIC_SHOWCASE_ENABLED = process.env.NEXT_PUBLIC_SHOWCASE_ENABLED;

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SENTRY_DSN: z.url().optional(),
  NEXT_PUBLIC_SHOWCASE_ENABLED: z.enum(['true', 'false']).default('false'),
});

const parsed = publicEnvSchema.safeParse({
  NEXT_PUBLIC_SENTRY_DSN,
  NEXT_PUBLIC_SHOWCASE_ENABLED,
});

if (!parsed.success) {
  throw new Error(
    `Invalid public environment variables:\n${z.prettifyError(parsed.error)}`,
  );
}

export const publicEnv = parsed.data;
