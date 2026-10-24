import { NetworkOnly, type RuntimeCaching } from 'serwist';

export const OFFLINE_URL = '/~offline';

const ADMIN_PATH = /^(\/[a-z]{2})?\/admin(\/|$)/;

function isUncachedPath(pathname: string): boolean {
  return pathname.startsWith('/api/') || ADMIN_PATH.test(pathname);
}

export const uncachedRule: RuntimeCaching = {
  matcher: ({ sameOrigin, url: { pathname } }) =>
    sameOrigin && isUncachedPath(pathname),
  handler: new NetworkOnly(),
};

export function withUncachedRoutes(
  defaults: RuntimeCaching[],
): RuntimeCaching[] {
  return [uncachedRule, ...defaults];
}

export function precacheEntries(revision: string) {
  return [{ url: OFFLINE_URL, revision }];
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
