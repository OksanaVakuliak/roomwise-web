import type { Configuration } from '@roomwise/calc-engine';
import { describe, expect, it } from 'vitest';
import { configurationHash, stableJson } from './hash';

const configuration = {
  finishLevel: 'STANDARD',
  totalAreaSqm: 60,
  balconyAreaSqm: 0,
  balconyTiles: false,
  gas: true,
  kitchenType: 'SEPARATE',
  rooms: [
    {
      clientId: 'room-1',
      roomTypeCode: 'BEDROOM',
      lengthM: 4,
      widthM: 3,
      heightM: 2.7,
      heatedFloor: false,
      selections: [{ categoryId: 'c1', productId: 'p1' }],
    },
  ],
  options: [],
  currency: 'USD',
} as unknown as Configuration;

describe('stableJson', () => {
  it('gives the same string regardless of key order', () => {
    const reordered = Object.fromEntries(
      Object.entries(configuration).reverse(),
    );
    expect(stableJson({ configuration: reordered, styleId: 's1' })).toBe(
      stableJson({ styleId: 's1', configuration }),
    );
  });

  it('sorts keys of nested objects and objects inside arrays', () => {
    expect(stableJson({ b: [{ d: 1, c: 2 }], a: { z: 1, y: 2 } })).toBe(
      '{"a":{"y":2,"z":1},"b":[{"c":2,"d":1}]}',
    );
  });

  it('keeps array order', () => {
    expect(stableJson([1, 2])).not.toBe(stableJson([2, 1]));
  });

  it('changes when a value changes', () => {
    const changed = { ...configuration, totalAreaSqm: 61 };
    expect(stableJson({ configuration, styleId: 's1' })).not.toBe(
      stableJson({ configuration: changed, styleId: 's1' }),
    );
    expect(stableJson({ configuration, styleId: 's1' })).not.toBe(
      stableJson({ configuration, styleId: null }),
    );
  });
});

describe('configurationHash', () => {
  it('is a short hex digest that fits the draft id limit', () => {
    expect(configurationHash(configuration, 's1')).toMatch(/^[0-9a-f]{16}$/);
  });

  it('ignores key order and follows configuration and style changes', () => {
    const reordered = Object.fromEntries(
      Object.entries(configuration).reverse(),
    ) as Configuration;
    const hash = configurationHash(configuration, 's1');
    expect(configurationHash(reordered, 's1')).toBe(hash);
    expect(
      configurationHash({ ...configuration, totalAreaSqm: 61 }, 's1'),
    ).not.toBe(hash);
    expect(configurationHash(configuration, null)).not.toBe(hash);
  });
});
