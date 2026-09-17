import type { NextConfig } from 'next';
import { z } from 'zod';

const apiOrigin = z.url().parse(process.env.API_ORIGIN).replace(/\/+$/, '');

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

export default nextConfig;
