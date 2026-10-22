import { NetworkOnly, type RuntimeCaching } from 'serwist';

export const OFFLINE_URL = '/~offline';

export const apiRule: RuntimeCaching = {
  matcher: ({ sameOrigin, url: { pathname } }) =>
    sameOrigin && pathname.startsWith('/api/'),
  handler: new NetworkOnly(),
};

export function withApiNeverCached(
  defaults: RuntimeCaching[],
): RuntimeCaching[] {
  return [apiRule, ...defaults];
}

export const fallbacks = {
  entries: [
    {
      url: OFFLINE_URL,
      matcher: ({ request }: { request: Request }) =>
        request.destination === 'document',
    },
  ],
};

export const workerOptions = {
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
} as const;
