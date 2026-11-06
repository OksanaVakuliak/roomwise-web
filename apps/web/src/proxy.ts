import { type NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const handleI18nRouting = createMiddleware(routing);

function supportedLanguages(header: string | null): string {
  const supported = (header ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => {
      const primary = entry.split(';')[0].split('-')[0].toLowerCase();
      return routing.locales.some((locale) => locale === primary);
    });
  return supported.length > 0 ? supported.join(',') : routing.defaultLocale;
}

const PROXY_SECRET_HEADER = 'x-roomwise-proxy-secret';

function forwardToApi(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.delete(PROXY_SECRET_HEADER);
  const secret = process.env.API_PROXY_SECRET;
  if (secret) {
    headers.set(PROXY_SECRET_HEADER, secret);
  }
  return NextResponse.next({ request: { headers } });
}

export default function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return forwardToApi(request);
  }
  request.headers.set(
    'accept-language',
    supportedLanguages(request.headers.get('accept-language')),
  );
  return handleI18nRouting(request);
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!(?:api|_next|_vercel|~offline)(?:/|$)|.*\\..*).*)',
  ],
};
