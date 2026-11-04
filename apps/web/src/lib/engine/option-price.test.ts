import { describe, expect, it } from 'vitest';
import { optionUnitPriceCents } from './option-price';

const coefficients = { tile_glue: 10, balcony_tile: 75.5 };

describe('optionUnitPriceCents', () => {
  it('returns the fixed price when there are no coefficient keys', () => {
    expect(
      optionUnitPriceCents(
        { priceCents: 45000, priceCoefficientKeys: [] },
        coefficients,
      ),
    ).toBe(45000);
  });

  it('sums the coefficients into cents', () => {
    expect(
      optionUnitPriceCents(
        {
          priceCents: null,
          priceCoefficientKeys: ['tile_glue', 'balcony_tile'],
        },
        coefficients,
      ),
    ).toBe(8550);
  });

  it('returns null when a coefficient is missing', () => {
    expect(
      optionUnitPriceCents(
        { priceCents: null, priceCoefficientKeys: ['tile_glue', 'unknown'] },
        coefficients,
      ),
    ).toBeNull();
  });
});
