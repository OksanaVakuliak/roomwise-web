export const adminHeaders = {
  source: '/:locale/admin/:path*',
  headers: [
    { key: 'Cache-Control', value: 'no-store' },
    { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
  ],
};
