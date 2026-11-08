import { beforeEach, describe, expect, it } from 'vitest';
import {
  categoryIds,
  makeDraftRoom,
  makeInteriorDraft,
  makePricingData,
  productIds,
} from '@/test/fixtures';
import type { DraftV1 } from '@/test/fixtures/draft';
import { clearEstimateCache, runEstimate } from './run-estimate';

const base = makePricingData();
const pricing = makePricingData({
  categories: [
    ...base.categories,
    {
      id: 'cat-wallpaper',
      wastePercent: 10,
      surface: 'WALLS',
      requiresPutty: false,
    },
  ],
  products: [
    ...base.products,
    {
      id: 'p-wallpaper',
      categoryId: 'cat-wallpaper',
      materialTypeId: 'mt-paint',
      priceCents: 1000,
      unit: 'SQM',
      wastePercentOverride: null,
      heatedFloorCompatible: true,
      available: true,
    },
  ],
  rules: [
    ...base.rules,
    {
      id: 'rule-wallpaper',
      level: 'CATEGORY',
      categoryId: 'cat-wallpaper',
      materialTypeId: null,
      name: { en: 'Wallpaper', uk: 'Wallpaper' },
      quantityFormula: 'wallArea * (1 + waste)',
      costFormula: 'quantity * price',
      sortOrder: 0,
      surface: null,
      laborFormula: null,
      baseComponent: false,
    },
  ],
});

const roomId = '00000000-0000-4000-8000-000000000301';

function draftWith(paintShare?: number, wallpaperShare?: number): DraftV1 {
  const selection = (productId: string, areaShare?: number) => ({
    productId,
    disabled: false,
    source: 'manual' as const,
    ...(areaShare !== undefined && { areaShare }),
  });
  return makeInteriorDraft({
    rooms: [
      makeDraftRoom({
        clientId: roomId,
        selections: {
          [categoryIds.walls]: selection(productIds.paint, paintShare),
          'cat-wallpaper': selection('p-wallpaper', wallpaperShare),
        },
      }),
    ],
  });
}

function run(draft: DraftV1) {
  return runEstimate({
    draft,
    draftRevision: 1,
    pricing,
    pricingVersion: pricing.version,
    currency: 'USD',
  });
}

function quantityOf(result: ReturnType<typeof run>, categoryId: string) {
  return result.estimate?.lines.find(
    (line) => line.section === 'MATERIALS' && line.categoryId === categoryId,
  )?.quantity;
}

beforeEach(clearEstimateCache);

describe('runEstimate area shares', () => {
  it('scales material quantities by the share of the surface', () => {
    const legacy = run(draftWith());
    const split = run(draftWith(60, 40));

    const full = quantityOf(legacy, categoryIds.walls) as number;
    expect(full).toBeGreaterThan(0);
    expect(quantityOf(legacy, 'cat-wallpaper')).toBeCloseTo(full, 6);
    expect(quantityOf(split, categoryIds.walls)).toBeCloseTo(full * 0.6, 6);
    expect(quantityOf(split, 'cat-wallpaper')).toBeCloseTo(full * 0.4, 6);
    expect(split.violations).toEqual([]);
  });

  it('keeps a legacy draft without shares priced as before', () => {
    const result = run(draftWith());

    expect(result.configuration?.rooms[0]?.selections).toEqual([
      { categoryId: categoryIds.walls, productId: productIds.paint },
      { categoryId: 'cat-wallpaper', productId: 'p-wallpaper' },
    ]);
    expect(result.estimate?.warnings.map((w) => w.code)).not.toContain(
      'AREA_SHARE_UNALLOCATED',
    );
  });

  it('warns when the shares leave part of the surface unallocated', () => {
    const result = run(draftWith(50, 30));

    expect(result.estimate?.warnings.map((w) => w.code)).toContain(
      'AREA_SHARE_UNALLOCATED',
    );
  });
});
