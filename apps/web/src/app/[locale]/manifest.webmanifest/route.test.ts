// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import en from '../../../../messages/en.json';
import uk from '../../../../messages/uk.json';
import { GET } from './route';

vi.mock('next-intl/server', () => ({
  getTranslations: async ({ locale }: { locale: 'en' | 'uk' }) => {
    const texts = { en, uk }[locale].Manifest;
    return (key: 'name' | 'description') => texts[key];
  },
}));

function request(locale: string) {
  return GET(new Request('http://localhost/x'), {
    params: Promise.resolve({ locale }),
  });
}

describe('manifest route', () => {
  it('serves the manifest of the locale', async () => {
    const response = await request('uk');

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe(
      'application/manifest+json',
    );
    const body = await response.json();
    expect(body.start_url).toBe('/uk');
    expect(body.name).toContain('Roomwise');
  });

  it('returns 404 for an unknown locale', async () => {
    const response = await request('de');
    expect(response.status).toBe(404);
  });
});
