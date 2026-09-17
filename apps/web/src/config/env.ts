import { z } from 'zod';

const envSchema = z.object({
  API_ORIGIN: z.url(),
  NEXT_PUBLIC_SENTRY_DSN: z.url().optional(),
  SENTRY_AUTH_TOKEN: z.string().min(1).optional(),
  NEXT_PUBLIC_SHOWCASE_ENABLED: z.enum(['true', 'false']).default('false'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const missing = parsed.error.issues.map((issue) => issue.path.join('.'));
  throw new Error(
    `Missing or invalid environment variables: ${missing.join(', ')}`,
  );
}

export const env = parsed.data;
