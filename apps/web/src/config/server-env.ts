import 'server-only';
import { z } from 'zod';

const serverEnvSchema = z.object({
  API_ORIGIN: z.url(),
  SENTRY_AUTH_TOKEN: z.string().min(1).optional(),
});

const parsed = serverEnvSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(
    `Invalid server environment variables:\n${z.prettifyError(parsed.error)}`,
  );
}

export const serverEnv = {
  ...parsed.data,
  API_ORIGIN: parsed.data.API_ORIGIN.replace(/\/+$/, ''),
};
