import { describe, expect, it } from 'vitest';
import { adminHeaders } from './admin-headers';

describe('adminHeaders', () => {
  it('covers the admin area in every locale, including its root', () => {
    expect(adminHeaders.source).toBe('/:locale/admin/:path*');
  });

  it('forbids caching and indexing', () => {
    expect(adminHeaders.headers).toEqual([
      { key: 'Cache-Control', value: 'no-store' },
      { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
    ]);
  });
});
