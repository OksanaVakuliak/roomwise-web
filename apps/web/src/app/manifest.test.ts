import { describe, expect, it } from 'vitest';
import { routing } from '@/i18n/routing';
import { buildManifest, SHORT_NAME } from '@/lib/pwa';
import { THEME_COLORS } from '@/lib/theme';
import en from '../../messages/en.json';
import uk from '../../messages/uk.json';

const catalogs = { en, uk };

describe('manifest', () => {
  it.each(routing.locales)('describes the installable app in %s', (locale) => {
    const texts = catalogs[locale].Manifest;
    const manifest = buildManifest(locale, texts);

    expect(manifest).toMatchObject({
      id: '/',
      name: texts.name,
      short_name: SHORT_NAME,
      description: texts.description,
      start_url: `/${locale}`,
      scope: '/',
      display: 'standalone',
      lang: locale,
      theme_color: THEME_COLORS.light,
      background_color: THEME_COLORS.light,
    });
  });

  it('is one app for every language', () => {
    const ids = routing.locales.map(
      (locale) => buildManifest(locale, catalogs[locale].Manifest).id,
    );
    expect(new Set(ids).size).toBe(1);
  });

  it('has localized names', () => {
    expect(en.Manifest.name).not.toBe(uk.Manifest.name);
    expect(en.Manifest.description).not.toBe(uk.Manifest.description);
  });

  it('lists the 192, 512 and maskable icons', () => {
    const { icons } = buildManifest('en', en.Manifest);

    expect(icons).toEqual([
      expect.objectContaining({
        src: '/icon-192.png',
        sizes: '192x192',
        purpose: 'any',
      }),
      expect.objectContaining({
        src: '/icon-512.png',
        sizes: '512x512',
        purpose: 'any',
      }),
      expect.objectContaining({
        src: '/icon-maskable.png',
        sizes: '512x512',
        purpose: 'maskable',
      }),
    ]);
  });
});
