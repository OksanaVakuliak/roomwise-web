import type { NextRequest } from 'next/server';
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

export default function proxy(request: NextRequest) {
  request.headers.set(
    'accept-language',
    supportedLanguages(request.headers.get('accept-language')),
  );
  return handleI18nRouting(request);
}

export const config = {
  matcher: '/((?!(?:api|_next|_vercel|~offline)(?:/|$)|.*\\..*).*)',
};
