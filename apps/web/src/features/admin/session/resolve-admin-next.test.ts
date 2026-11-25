import { describe, expect, it } from 'vitest';
import { resolveAdminNext } from './resolve-admin-next';

describe('resolveAdminNext', () => {
  it.each([
    ['/admin/leads', '/admin/leads'],
    ['/admin/leads?status=NEW&page=2', '/admin/leads?status=NEW&page=2'],
    ['/admin', '/admin'],
    ['/admin/catalog/products#top', '/admin/catalog/products#top'],
  ])('keeps %s', (raw, expected) => {
    expect(resolveAdminNext(raw)).toBe(expected);
  });

  it.each([
    null,
    undefined,
    '',
    'admin/leads',
    'https://evil.example/admin',
    '//evil.example/admin',
    '/\evil.example',
    '/\/evil.example',
    'javascript:alert(1)',
    '/configurator',
    '/administrator',
    '/en/admin/leads',
    '/admin/login',
    '/admin/login?next=/admin',
  ])('falls back to /admin for %s', (raw) => {
    expect(resolveAdminNext(raw)).toBe('/admin');
  });
});
