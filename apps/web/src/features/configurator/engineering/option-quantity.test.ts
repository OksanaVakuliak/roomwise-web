import { describe, expect, it } from 'vitest';
import { makePricingData } from '@/test/fixtures/pricing-data';
import {
  firstInvalidQuantityId,
  isQuantityValid,
  optionQuantityId,
  quantityBounds,
} from './option-quantity';

const { options } = makePricingData();

describe('quantityBounds', () => {
  it('defaults the minimum to 1 and leaves the maximum open', () => {
    expect(quantityBounds({ minQuantity: null, maxQuantity: null })).toEqual({
      min: 1,
      max: undefined,
    });
  });
});

describe('isQuantityValid', () => {
  const bounds = { min: 2, max: 5 };

  it.each([
    [2, true],
    [5, true],
    [1, false],
    [6, false],
    [undefined, true],
  ])('checks %s', (quantity, expected) => {
    expect(isQuantityValid(quantity, bounds)).toBe(expected);
  });
});

describe('firstInvalidQuantityId', () => {
  it('returns null when every chosen quantity is within the limits', () => {
    expect(firstInvalidQuantityId(options, { 'opt-ac': { quantity: 3 } })).toBe(
      null,
    );
  });

  it('returns the field id of the first out-of-range piece option', () => {
    expect(
      firstInvalidQuantityId(options, { 'opt-ac': { quantity: 11 } }),
    ).toBe(optionQuantityId('opt-ac'));
  });

  it('ignores options that are not chosen and non-piece options', () => {
    expect(
      firstInvalidQuantityId(options, { 'opt-design': { quantity: 99 } }),
    ).toBe(null);
  });
});
