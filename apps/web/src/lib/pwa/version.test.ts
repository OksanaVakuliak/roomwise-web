import { describe, expect, it } from 'vitest';
import { isNewVersion, workerUrl } from './version';

describe('workerUrl', () => {
  it('appends the version', () => {
    expect(workerUrl('/serwist/sw.js', 'abc 1')).toBe(
      '/serwist/sw.js?v=abc%201',
    );
  });

  it('leaves the path alone without a version', () => {
    expect(workerUrl('/serwist/sw.js', undefined)).toBe('/serwist/sw.js');
  });
});

describe('isNewVersion', () => {
  it('is false for the same version', () => {
    expect(isNewVersion('https://roomwise.app/serwist/sw.js?v=a', 'a')).toBe(
      false,
    );
  });

  it('is true for a different version', () => {
    expect(isNewVersion('/serwist/sw.js?v=b', 'a')).toBe(true);
  });

  it.each([
    [undefined, 'a'],
    ['/serwist/sw.js', 'a'],
    ['/serwist/sw.js?v=b', undefined],
  ])('is false when %s is compared with %s', (url, version) => {
    expect(isNewVersion(url, version)).toBe(false);
  });
});
