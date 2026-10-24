import { PricingDataSchema } from '@roomwise/calc-engine';
import { describe, expect, it } from 'vitest';
import {
  categoryIds,
  makeCategoryProducts,
  makeDefaultMaterials,
  makeEngineering,
  makePricingData,
  makeRoomTypes,
  makeVersionView,
  productIds,
  roomTypeIds,
  styleIds,
} from './index';

describe('fixtures', () => {
  const pricing = makePricingData();

  it('parses pricing data with the engine schema', () => {
    expect(PricingDataSchema.safeParse(pricing).success).toBe(true);
    expect(pricing.version).toBeTruthy();
    expect(pricing.limits.rooms.max).toBe(15);
    expect(pricing.exchangeRate?.rate).toBeTruthy();
  });

  it('keeps catalog ids consistent with pricing data', () => {
    const roomTypeCodes = pricing.roomTypes.map((type) => type.code);
    expect(Object.keys(roomTypeIds).sort()).toEqual([...roomTypeCodes].sort());
    expect(pricing.roomTypes.map((type) => type.id).sort()).toEqual(
      Object.values(roomTypeIds).sort(),
    );
    const pricedCategories = pricing.categories.map((category) => category.id);
    for (const type of makeRoomTypes().items) {
      expect(type.categories.map((category) => category.id)).toEqual(
        pricedCategories,
      );
    }
    for (const categoryId of Object.values(categoryIds)) {
      for (const product of makeCategoryProducts(categoryId).items) {
        const priced = pricing.products.find((item) => item.id === product.id);
        expect(priced?.categoryId).toBe(categoryId);
        expect(priced?.priceCents).toBe(product.priceCents);
      }
    }
    const pricedProducts = pricing.products.map((product) => product.id);
    for (const styleId of Object.values(styleIds)) {
      for (const item of makeDefaultMaterials(styleId).items) {
        expect(pricedProducts).toContain(item.productId);
      }
    }
    expect(Object.values(productIds).sort()).toEqual(
      [...pricedProducts].sort(),
    );
  });

  it('keeps engineering ids consistent with pricing data', () => {
    const engineering = makeEngineering();
    expect(engineering.packageItems.map((item) => item.id).sort()).toEqual(
      pricing.packageItems.map((item) => item.id).sort(),
    );
    expect(engineering.options.map((option) => option.id).sort()).toEqual(
      pricing.options.map((option) => option.id).sort(),
    );
  });

  it('keeps the version view totals equal to the sum of its lines', () => {
    const view = makeVersionView();
    expect(view.totals.usdCents).toBe(
      view.lines.reduce((sum, line) => sum + line.amountCents, 0),
    );
  });
});
