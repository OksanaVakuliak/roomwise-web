import {
  type Currency,
  estimate as computeEstimate,
  type EstimateLine,
  type PricingData,
} from '@roomwise/calc-engine';
import type { DraftV1 } from '@/lib/draft/schema';
import { findHeatedFloorOption } from './heated-floor';
import { toConfiguration } from './to-configuration';

export type CardCostContext = {
  draft: DraftV1;
  pricing: PricingData;
  pricingVersion: string;
  currency: Currency;
  shape: string;
  layoutShape: string;
};

const CACHE_SIZE = 64;
const cache = new Map<string, Map<string, EstimateLine | null>>();

function shapeOf(draft: DraftV1, withHeatedFloor: boolean): string {
  return JSON.stringify([
    draft.object,
    draft.rooms.map(
      ({ clientId, roomTypeCode, lengthM, widthM, heightM, heatedFloor }) => [
        clientId,
        roomTypeCode,
        lengthM,
        widthM,
        heightM,
        withHeatedFloor && heatedFloor,
      ],
    ),
  ]);
}

export function cardCostContext(
  draft: DraftV1,
  pricing: PricingData,
  pricingVersion: string,
  currency: Currency,
): CardCostContext {
  return {
    draft,
    pricing,
    pricingVersion,
    currency,
    shape: shapeOf(draft, true),
    layoutShape: shapeOf(draft, false),
  };
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
  const { draft, pricingVersion, currency, shape } = context;
  const key = `product|${pricingVersion}|${currency}|${shape}|${roomClientId}|${categoryId}`;
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

function engineeringLine(
  context: CardCostContext,
  keyPrefix: string,
  shape: string,
  roomClientId: string,
  optionId: string,
  reduce: (draft: DraftV1) => DraftV1,
): EstimateLine | null {
  const { draft, pricingVersion, currency } = context;
  const key = `${keyPrefix}|${pricingVersion}|${currency}|${shape}|${roomClientId}`;
  const lines = remember(key);
  if (lines.has(optionId)) {
    return lines.get(optionId) ?? null;
  }
  const line = lineOf(reduce(draft), context, `ENGINEERING:option:${optionId}`);
  lines.set(optionId, line);
  return line;
}

export function optionRoomLine(
  context: CardCostContext,
  roomClientId: string,
  optionId: string,
): EstimateLine | null {
  return engineeringLine(
    context,
    'option',
    context.shape,
    roomClientId,
    optionId,
    (draft) => ({
      ...draft,
      options: { [optionId]: { quantity: 1, roomClientIds: [roomClientId] } },
      rooms: draft.rooms.map((room) => ({ ...room, selections: {} })),
    }),
  );
}

export function heatedFloorRoomLine(
  context: CardCostContext,
  roomClientId: string,
): EstimateLine | null {
  const option = findHeatedFloorOption(context.pricing.options);
  if (!option) {
    return null;
  }
  return engineeringLine(
    context,
    'heated-floor',
    context.layoutShape,
    roomClientId,
    option.id,
    (draft) => ({
      ...draft,
      options: {},
      rooms: draft.rooms.map((room) => ({
        ...room,
        selections: {},
        heatedFloor: room.clientId === roomClientId,
      })),
    }),
  );
}

export function clearCardCostCache(): void {
  cache.clear();
}
