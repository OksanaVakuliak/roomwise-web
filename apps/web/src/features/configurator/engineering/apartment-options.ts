import type { PricingData } from '@roomwise/calc-engine';
import type { OptionScope } from '@/lib/engine/room-options';

type PricedOption = PricingData['options'][number];

export type OptionText = {
  id: string;
  name: string;
  description: string;
  kind: string;
  perRoom: boolean;
  code?: string | null;
};

export type ApartmentOption = PricedOption & {
  name: string;
  description: string;
};

export function apartmentOptions(
  texts: readonly OptionText[] | undefined,
  pricingOptions: readonly PricedOption[],
  kind: 'ENGINEERING' | 'ADDITIONAL',
  scope: OptionScope,
  chosen: Readonly<Record<string, unknown>>,
): ApartmentOption[] {
  const priced = new Map(pricingOptions.map((o) => [o.id, o]));
  return (texts ?? []).flatMap((text) => {
    const price = priced.get(text.id);
    if (
      !price ||
      text.kind !== kind ||
      text.perRoom ||
      text.code === 'HEATED_FLOOR' ||
      ((price.available === false || !price.scopes.includes(scope)) &&
        chosen[text.id] === undefined)
    ) {
      return [];
    }
    return [{ ...price, name: text.name, description: text.description }];
  });
}
