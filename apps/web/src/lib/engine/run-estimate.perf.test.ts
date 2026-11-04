import { beforeEach, describe, expect, it } from 'vitest';
import { makeFullRoomsDraft, makePricingData } from '@/test/fixtures';
import { categoryIds, productIds } from '@/test/fixtures/catalog';
import {
  cardCostContext,
  clearCardCostCache,
  productCardLine,
} from './card-cost';
import { clearEstimateCache, runEstimate } from './run-estimate';

const WARM_UP_RUNS = 5;
const SAMPLE_COUNT = 15;
const CARD_COUNT = 30;
const BUDGET_MS = 50;

const pricing = makePricingData();
const draft = makeFullRoomsDraft();

const productByCategory: Record<string, string> = {
  [categoryIds.floor]: productIds.laminate,
  [categoryIds.walls]: productIds.paint,
  [categoryIds.ceiling]: productIds.ceilingPaint,
};

const cards = draft.rooms
  .flatMap((room) =>
    Object.entries(productByCategory).map(([categoryId, productId]) => ({
      roomClientId: room.clientId,
      categoryId,
      productId,
    })),
  )
  .slice(0, CARD_COUNT);

function measureOnce(): number {
  clearEstimateCache();
  clearCardCostCache();
  const start = performance.now();
  runEstimate({
    draft,
    draftRevision: 1,
    pricing,
    pricingVersion: pricing.version,
    currency: 'USD',
  });
  const context = cardCostContext(draft, pricing, pricing.version, 'USD');
  for (const { roomClientId, categoryId, productId } of cards) {
    productCardLine(context, roomClientId, categoryId, productId);
  }
  return performance.now() - start;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2
    : (sorted[middle] ?? 0);
}

beforeEach(() => {
  clearEstimateCache();
  clearCardCostCache();
});

describe('estimate performance', () => {
  it('keeps a full estimate with product cards within the budget for 15 rooms', () => {
    expect(draft.rooms).toHaveLength(15);
    expect(cards).toHaveLength(CARD_COUNT);

    for (let run = 0; run < WARM_UP_RUNS; run += 1) {
      measureOnce();
    }
    const samples = Array.from({ length: SAMPLE_COUNT }, measureOnce);

    expect(median(samples)).toBeLessThanOrEqual(BUDGET_MS);
  });
});
