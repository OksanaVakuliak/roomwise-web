import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['showcase', 'admin'].flatMap((path) =>
        routing.locales.map((locale) => `/${locale}/${path}`),
      ),
    },
  };
}
