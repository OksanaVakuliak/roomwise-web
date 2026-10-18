import { describe, expect, it } from 'vitest';
import { cx } from './index';

describe('cx', () => {
  it('joins truthy values with a single space', () => {
    expect(cx('a', 'b', 'c')).toBe('a b c');
  });

  it('drops false, null, undefined and empty strings', () => {
    expect(cx('a', false, null, undefined, '', 'b')).toBe('a b');
  });

  it('returns an empty string when nothing is left', () => {
    expect(cx(false, undefined)).toBe('');
  });

  it('leaves no leading or trailing spaces', () => {
    expect(cx(undefined, 'a', false)).toBe('a');
  });
});
