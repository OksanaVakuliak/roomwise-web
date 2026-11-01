import { estimate } from '@roomwise/calc-engine';
import { beforeEach, describe, expect, it } from 'vitest';
import { makeInteriorDraft, makePricingData } from '@/test/fixtures';
import { categoryIds, productIds } from '@/test/fixtures/catalog';
import { clearCardCostCache, productCardLine } from './card-cost';
import { toConfiguration } from './to-configuration';

const pricing = makePricingData();
const living = '00000000-0000-4000-8000-000000000301';
const bath = '00000000-0000-4000-8000-000000000302';

function context(draft = makeInteriorDraft()) {
  return {
    draft,
    pricing,
    pricingVersion: pricing.version,
    currency: 'USD' as const,
  };
}

function fullLine(draft: ReturnType<typeof makeInteriorDraft>, lineId: string) {
  const configuration = toConfiguration(draft, pricing, {
    mode: 'preview',
    currency: 'USD',
  });
  return estimate(configuration!, pricing).lines.find(
    (line) => line.id === lineId,
  );
}

beforeEach(clearCardCostCache);

describe('productCardLine', () => {
  it('matches the line of the full estimate', () => {
    const draft = makeInteriorDraft();
    for (const [room, category, product] of [
      [living, categoryIds.floor, productIds.laminate],
      [living, categoryIds.walls, productIds.paint],
      [bath, categoryIds.floor, productIds.tile],
    ] as const) {
      const line = productCardLine(context(draft), room, category, product);
      const expected = fullLine(draft, `MATERIALS:${room}:${category}`);
      expect(line).not.toBeNull();
      expect(line?.amountCents).toBe(expected?.amountCents);
      expect(line?.amountCents).toBeGreaterThan(0);
    }
  });

  it('returns the memoized line on a repeated call', () => {
    const args = [living, categoryIds.floor, productIds.laminate] as const;
    expect(productCardLine(context(), ...args)).toBe(
      productCardLine(context(), ...args),
    );
  });

  it('returns null when the line is absent', () => {
    expect(
      productCardLine(
        context(),
        'missing-room',
        categoryIds.floor,
        productIds.laminate,
      ),
    ).toBeNull();
  });

  it('returns null when the draft cannot be configured', () => {
    const draft = makeInteriorDraft();
    const broken = {
      ...draft,
      object: { ...draft.object, finishLevel: null },
    };
    expect(
      productCardLine(
        context(broken),
        living,
        categoryIds.floor,
        productIds.laminate,
      ),
    ).toBeNull();
  });
});
