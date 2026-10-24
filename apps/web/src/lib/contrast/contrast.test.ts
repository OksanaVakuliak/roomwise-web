import { describe, expect, it } from 'vitest';
import { measure, parseColor, verdict } from './contrast';

describe('contrast helpers', () => {
  it('measures black on white as 21:1', () => {
    const roles = { sheet: parseColor('#fff'), line: parseColor('#000') };
    expect(
      measure(roles, { fg: 'line', bg: 'sheet', kind: 'text' }),
    ).toBeCloseTo(21, 1);
  });

  it('classifies ratios', () => {
    expect(verdict(5)).toBe('aa');
    expect(verdict(3.5)).toBe('aaLarge');
    expect(verdict(2)).toBe('fail');
  });
});
