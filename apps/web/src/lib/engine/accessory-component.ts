import type { EstimateLine } from '@roomwise/calc-engine';

type Component = NonNullable<EstimateLine['components']>[number];

export function accessoryKey(component: Component): string | undefined {
  return component.kind === 'ACCESSORY' && component.amountCents > 0
    ? component.coefficientKey
    : undefined;
}

export function ownName<T>(
  names: Readonly<Record<string, T>> | undefined,
  key: string,
): T | undefined {
  return names !== undefined && Object.hasOwn(names, key)
    ? names[key]
    : undefined;
}
