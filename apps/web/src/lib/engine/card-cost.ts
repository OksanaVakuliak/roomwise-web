import {
  type Currency,
  estimate as computeEstimate,
  type EstimateLine,
  type PricingData,
} from '@roomwise/calc-engine';
import type { DraftV1 } from '@/lib/draft/schema';
import { toConfiguration } from './to-configuration';

export type CardCostContext = {
  draft: DraftV1;
  pricing: PricingData;
  pricingVersion: string;
  currency: Currency;
};

const CACHE_SIZE = 64;
const cache = new Map<string, Map<string, EstimateLine | null>>();

function shapeOf(draft: DraftV1): string {
  return JSON.stringify([
    draft.object,
    draft.rooms.map(
      ({ clientId, roomTypeCode, lengthM, widthM, heightM, heatedFloor }) => [
        clientId,
        roomTypeCode,
        lengthM,
        widthM,
        heightM,
        heatedFloor,
      ],
    ),
  ]);
}

function remember(key: string): Map<string, EstimateLine | null> {
  const found = cache.get(key);
  if (found) {
    cache.delete(key);
    cache.set(key, found);
    return found;
  }
  const created = new Map<string, EstimateLine | null>();
  cache.set(key, created);
  if (cache.size > CACHE_SIZE) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) {
      cache.delete(oldest);
    }
  }
  return created;
}

function lineOf(
  draft: DraftV1,
  context: CardCostContext,
  lineId: string,
): EstimateLine | null {
  const configuration = toConfiguration(draft, context.pricing, {
    mode: 'preview',
    currency: context.currency,
  });
  if (configuration === null) {
    return null;
  }
  const { lines } = computeEstimate(configuration, context.pricing);
  return lines.find((line) => line.id === lineId) ?? null;
}

export function productCardLine(
  context: CardCostContext,
  roomClientId: string,
  categoryId: string,
  productId: string,
): EstimateLine | null {
  const { draft, pricingVersion, currency } = context;
  const key = `product|${pricingVersion}|${currency}|${shapeOf(draft)}|${roomClientId}|${categoryId}`;
  const lines = remember(key);
  if (lines.has(productId)) {
    return lines.get(productId) ?? null;
  }
  const reduced: DraftV1 = {
    ...draft,
    options: {},
    rooms: draft.rooms.map((room) => ({
      ...room,
      selections:
        room.clientId === roomClientId
          ? {
              [categoryId]: { productId, disabled: false, source: 'manual' },
            }
          : {},
    })),
  };
  const line = lineOf(
    reduced,
    context,
    `MATERIALS:${roomClientId}:${categoryId}`,
  );
  lines.set(productId, line);
  return line;
}

export function clearCardCostCache(): void {
  cache.clear();
}
