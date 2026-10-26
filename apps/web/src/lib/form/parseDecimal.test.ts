import { describe, expect, it } from 'vitest';
import { parseDecimal } from './parseDecimal';

describe('parseDecimal', () => {
  it.each([
    ['64', 64],
    ['64.5', 64.5],
    ['64,5', 64.5],
    ['  3,5 ', 3.5],
    ['3.', 3],
    ['64,', 64],
    ['.5', 0.5],
    [',5', 0.5],
    ['0', 0],
  ])('parses %j as %d', (text, expected) => {
    expect(parseDecimal(text)).toBe(expected);
  });

  it('treats blank text as null', () => {
    expect(parseDecimal('')).toBeNull();
    expect(parseDecimal('   ')).toBeNull();
  });

  it.each(['abc', '.', ',', '1.2.3', '1,2,3', '-5', '1e3', '1 000', 'NaN'])(
    'rejects %j',
    (text) => {
      expect(parseDecimal(text)).toBeUndefined();
    },
  );
});
