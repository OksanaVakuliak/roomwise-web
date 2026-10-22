import type { MetadataRoute } from 'next';
import { THEME_COLORS } from '@/lib/theme';

export type ManifestTexts = { name: string; description: string };

export const SHORT_NAME = 'Roomwise';

export function buildManifest(
  locale: string,
  { name, description }: ManifestTexts,
): MetadataRoute.Manifest {
  return {
    id: '/',
    name,
    short_name: SHORT_NAME,
    description,
    start_url: `/${locale}`,
    scope: '/',
    display: 'standalone',
    lang: locale,
    background_color: THEME_COLORS.light,
    theme_color: THEME_COLORS.light,
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
