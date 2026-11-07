import { estimate } from '@roomwise/calc-engine';
import { beforeEach, describe, expect, it } from 'vitest';
import type { DraftRoom } from '@/lib/draft/schema';
import {
  makeInteriorDraft,
  makePartialDraft,
  makePricingData,
} from '@/test/fixtures';
import { categoryIds, productIds } from '@/test/fixtures/catalog';
import {
  cardCostContext,
  clearCardCostCache,
  heatedFloorRoomLine,
  optionRoomLine,
  productCardLine,
} from './card-cost';
import { toConfiguration } from './to-configuration';

const pricing = makePricingData();
const living = '00000000-0000-4000-8000-000000000301';
const bath = '00000000-0000-4000-8000-000000000302';

function context(draft = makeInteriorDraft()) {
  return cardCostContext(draft, pricing, pricing.version, 'USD');
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

  it('includes labor and preparation at partial scope', () => {
    const draft = makePartialDraft({
      object: { ...makePartialDraft().object, finishLevel: 'ROUGH' },
    });
    const line = productCardLine(
      context(draft),
      living,
      categoryIds.floor,
      productIds.laminate,
    );
    const expected = fullLine(
      {
        ...draft,
        rooms: draft.rooms.map((room) => ({
          ...room,
          selections: (room.clientId === living
            ? {
                [categoryIds.floor]: {
                  productId: productIds.laminate,
                  disabled: false,
                  source: 'manual' as const,
                },
              }
            : {}) as DraftRoom['selections'],
        })),
      },
      `MATERIALS:${living}:${categoryIds.floor}`,
    );

    expect(line?.components?.map((component) => component.kind)).toEqual([
      'MATERIAL',
      'LABOR',
      'PREP',
    ]);
    expect(line?.amountCents).toBe(expected?.amountCents);
    const material = line?.components?.[0].amountCents ?? 0;
    expect(line?.amountCents).toBeGreaterThan(material);
  });

  it('drops preparation when the finish level changes', () => {
    const rough = makePartialDraft({
      object: { ...makePartialDraft().object, finishLevel: 'ROUGH' },
    });
    const pre = makePartialDraft();
    const args = [living, categoryIds.floor, productIds.laminate] as const;
    const roughPrep = productCardLine(context(rough), ...args)?.components?.[2];
    const prePrep = productCardLine(context(pre), ...args)?.components?.[2];

    expect(roughPrep?.amountCents).toBeGreaterThan(0);
    expect(prePrep?.amountCents).toBe(0);
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

describe('optionRoomLine', () => {
  it('matches the room share of the full estimate', () => {
    const draft = makeInteriorDraft({
      options: {
        'opt-soundproofing': { quantity: 1, roomClientIds: [living] },
      },
    });
    const line = optionRoomLine(context(draft), living, 'opt-soundproofing');
    expect(line?.amountCents).toBe(
      fullLine(draft, 'ENGINEERING:option:opt-soundproofing')?.amountCents,
    );
    expect(line?.amountCents).toBeGreaterThan(0);
  });

  it('returns the memoized line on a repeated call', () => {
    expect(optionRoomLine(context(), living, 'opt-soundproofing')).toBe(
      optionRoomLine(context(), living, 'opt-soundproofing'),
    );
  });

  it('returns null for an unknown option', () => {
    expect(optionRoomLine(context(), living, 'missing')).toBeNull();
  });
});

describe('heatedFloorRoomLine', () => {
  it('matches the heated floor line of the full estimate for a single room', () => {
    const draft = makeInteriorDraft();
    const line = heatedFloorRoomLine(context(draft), bath);
    expect(line?.amountCents).toBe(
      fullLine(draft, 'ENGINEERING:option:opt-heated-floor')?.amountCents,
    );
    expect(line?.amountCents).toBeGreaterThan(0);
  });

  it('prices the room even when its heated floor is off', () => {
    const draft = makeInteriorDraft();
    const off = {
      ...draft,
      rooms: draft.rooms.map((room) => ({ ...room, heatedFloor: false })),
    };
    expect(heatedFloorRoomLine(context(off), bath)?.amountCents).toBe(
      heatedFloorRoomLine(context(draft), bath)?.amountCents,
    );
  });

  it('ignores the heated floor of other rooms', () => {
    const draft = makeInteriorDraft();
    const both = {
      ...draft,
      rooms: draft.rooms.map((room) => ({
        ...room,
        roomTypeCode: 'BATHROOM' as const,
        heatedFloor: true,
      })),
    };
    const alone = heatedFloorRoomLine(context(draft), bath);
    const shared = heatedFloorRoomLine(context(both), bath);
    expect(shared?.amountCents).toBeLessThan(
      fullLine(both, 'ENGINEERING:option:opt-heated-floor')?.amountCents ?? 0,
    );
    expect(shared?.amountCents).toBeGreaterThan(0);
    expect(alone?.amountCents).toBeGreaterThan(0);
  });

  it('returns null for a room type the option does not allow', () => {
    expect(heatedFloorRoomLine(context(), living)).toBeNull();
  });

  it('returns the memoized line on a repeated call', () => {
    expect(heatedFloorRoomLine(context(), bath)).toBe(
      heatedFloorRoomLine(context(), bath),
    );
  });
});
