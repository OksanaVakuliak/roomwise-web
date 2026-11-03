import { describe, expect, it } from 'vitest';
import robots from './robots';

describe('robots', () => {
  it('disallows the showcase in every locale and allows the rest', () => {
    expect(robots().rules).toEqual({
      userAgent: '*',
      allow: '/',
      disallow: ['/en/showcase', '/uk/showcase'],
    });
  });

  it('does not disallow saved calculations so crawlers can read noindex', () => {
    const { rules } = robots();
    const disallow = [rules].flat().flatMap((rule) => rule.disallow ?? []);

    expect(disallow.some((path) => path.includes('/calculations'))).toBe(false);
  });
});
