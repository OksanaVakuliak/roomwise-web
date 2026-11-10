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

export function visibleAccessory<T>(
  component: Component,
  nameOf: (key: string) => T | undefined,
): { key: string; name: T } | undefined {
  const key = accessoryKey(component);
  const name = key === undefined ? undefined : nameOf(key);
  return key === undefined || name === undefined ? undefined : { key, name };
}
