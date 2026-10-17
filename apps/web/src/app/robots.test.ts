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
});
