import { convertCentsToKopecks } from '@roomwise/calc-engine';
import { describe, expect, it } from 'vitest';
import { partKopecks } from './part-kopecks';

describe('partKopecks', () => {
  it('adds up to the line amount in hryvnias', () => {
    const rate = '41.3333';
    const parts = [101, 101, 101];
    const line = convertCentsToKopecks(303, rate);
    const kopecks = partKopecks(parts, line, rate);

    expect(kopecks.reduce((sum, value) => (sum ?? 0) + (value ?? 0), 0)).toBe(
      line,
    );
    expect(kopecks[0]).toBe(convertCentsToKopecks(101, rate));
  });

  it('keeps a zero part at zero', () => {
    const kopecks = partKopecks([500, 0], 20000, '40');

    expect(kopecks).toEqual([20000, 0]);
  });

  it('returns no hryvnias without a rate or a line amount', () => {
    expect(partKopecks([100, 200], null, '40')).toEqual([null, null]);
    expect(partKopecks([100, 200], 12000, null)).toEqual([null, null]);
  });
});
