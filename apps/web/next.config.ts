import { withSentryConfig } from '@sentry/nextjs/config';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { z } from 'zod';

const parsedApiOrigin = z.url().safeParse(process.env.API_ORIGIN);

if (!parsedApiOrigin.success) {
  throw new Error(
    `Invalid API_ORIGIN:\n${z.prettifyError(parsedApiOrigin.error)}`,
  );
}

const apiOrigin = parsedApiOrigin.data.replace(/\/+$/, '');

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
};

export default withSentryConfig(withNextIntl(nextConfig), {
  silent: true,
  telemetry: false,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
});
