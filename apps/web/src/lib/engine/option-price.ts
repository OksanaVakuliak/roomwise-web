import { type PricingData, toCents } from '@roomwise/calc-engine';

type PricedOption = PricingData['options'][number];

export function optionUnitPriceCents(
  option: Pick<PricedOption, 'priceCents' | 'priceCoefficientKeys'>,
  coefficients: PricingData['coefficients'],
): number | null {
  if (option.priceCoefficientKeys.length === 0) {
    return option.priceCents;
  }
  let dollars = 0;
  for (const key of option.priceCoefficientKeys) {
    if (!Object.hasOwn(coefficients, key)) {
      return null;
    }
    dollars += coefficients[key];
  }
  return toCents(dollars);
}
