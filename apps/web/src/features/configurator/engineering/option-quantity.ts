import type { PricingData } from '@roomwise/calc-engine';
import type { ApartmentOption } from './apartment-options';

type PricedOption = PricingData['options'][number];

export type QuantityBounds = { min: number; max: number | undefined };

export function optionQuantityId(optionId: string) {
  return `option-quantity-${optionId}`;
}

export function quantityBounds(
  option: Pick<PricedOption, 'minQuantity' | 'maxQuantity'>,
): QuantityBounds {
  return {
    min: option.minQuantity ?? 1,
    max: option.maxQuantity ?? undefined,
  };
}

export function isQuantityValid(
  quantity: number | undefined,
  bounds: QuantityBounds,
) {
  const value = quantity ?? bounds.min;
  return (
    Number.isInteger(value) &&
    value >= bounds.min &&
    (bounds.max === undefined || value <= bounds.max)
  );
}

export function firstInvalidQuantityId(
  options: readonly Pick<
    ApartmentOption,
    'id' | 'unit' | 'minQuantity' | 'maxQuantity'
  >[],
  chosen: Readonly<Record<string, { quantity?: number }>>,
): string | null {
  const invalid = options.find(
    (option) =>
      option.unit === 'PIECE' &&
      chosen[option.id] !== undefined &&
      !isQuantityValid(chosen[option.id]?.quantity, quantityBounds(option)),
  );
  return invalid ? optionQuantityId(invalid.id) : null;
}
