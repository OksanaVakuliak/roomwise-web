import { describe, expect, it } from 'vitest';
import { isEqual } from './is-equal';

describe('isEqual', () => {
  it('treats undefined values as absent keys', () => {
    expect(isEqual({ a: undefined }, {})).toBe(true);
    expect(isEqual({ a: undefined, b: 1 }, { b: 1 })).toBe(true);
    expect(isEqual({ a: 1 }, { a: undefined })).toBe(false);
  });

  it('compares dates by time', () => {
    expect(isEqual(new Date(5), new Date(5))).toBe(true);
    expect(isEqual(new Date(5), new Date(6))).toBe(false);
    expect(isEqual({ at: new Date(5) }, { at: new Date(5) })).toBe(true);
  });

  it('compares non-plain objects by reference', () => {
    expect(isEqual(new Map([[1, 2]]), new Map([[1, 2]]))).toBe(false);
    const map = new Map();
    expect(isEqual(map, map)).toBe(true);
  });

  it('compares nested arrays and objects deeply', () => {
    expect(isEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] })).toBe(true);
    expect(isEqual([1], { 0: 1 })).toBe(false);
  });
});
