import type { NextConfig } from 'next';
import { env } from './src/config/env';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${env.API_ORIGIN}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
