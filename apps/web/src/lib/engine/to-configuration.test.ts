import { describe, expect, it } from 'vitest';
import {
  categoryIds,
  makeDraftRoom,
  makeEmptyDraft,
  makeInteriorDraft,
  makePricingData,
  productIds,
} from '@/test/fixtures';
import type { DraftV1 } from '@/test/fixtures/draft';
import { IncompleteDraftError, toConfiguration } from './to-configuration';

const pricing = makePricingData();
const preview = { mode: 'preview', currency: 'USD' } as const;
const strict = { mode: 'strict', currency: 'USD' } as const;

function withObject(patch: Partial<DraftV1['object']>): DraftV1 {
  const draft = makeInteriorDraft();
  return { ...draft, object: { ...draft.object, ...patch } };
}

function reasonOf(draft: DraftV1): string | undefined {
  try {
    toConfiguration(draft, pricing, strict);
  } catch (error) {
    return error instanceof IncompleteDraftError ? error.reason : undefined;
  }
  return undefined;
}

describe('toConfiguration object fields', () => {
  it('returns null without finish level (preview) and throws (strict)', () => {
    const draft = withObject({ finishLevel: null });
    expect(toConfiguration(draft, pricing, preview)).toBeNull();
    expect(reasonOf(draft)).toBe('FINISH_LEVEL');
  });

  it.each([
    ['null', null],
    ['below the minimum', pricing.limits.totalAreaSqm.min - 1],
    ['above the maximum', pricing.limits.totalAreaSqm.max + 1],
  ])('returns null when total area is %s', (_, totalAreaSqm) => {
    const draft = withObject({ totalAreaSqm });
    expect(toConfiguration(draft, pricing, preview)).toBeNull();
    expect(reasonOf(draft)).toBe('TOTAL_AREA');
  });

  it('accepts the exact limit values', () => {
    const { min, max } = pricing.limits.totalAreaSqm;
    expect(
      toConfiguration(withObject({ totalAreaSqm: min }), pricing, preview),
    ).not.toBeNull();
    expect(
      toConfiguration(withObject({ totalAreaSqm: max }), pricing, preview),
    ).not.toBeNull();
  });

  it.each([
    [{ present: false, areaSqm: 5, tiles: true }, 0, false],
    [{ present: true, areaSqm: null, tiles: true }, 0, true],
    [{ present: true, areaSqm: 4, tiles: false }, 4, false],
    [{ present: true, areaSqm: 4, tiles: true }, 4, true],
  ])('maps balcony %o', (balcony, areaSqm, tiles) => {
    const configuration = toConfiguration(
      withObject({ balcony }),
      pricing,
      preview,
    );
    expect(configuration?.balconyAreaSqm).toBe(areaSqm);
    expect(configuration?.balconyTiles).toBe(tiles);
  });

  it('passes gas and kitchen type as is', () => {
    const configuration = toConfiguration(
      withObject({ gas: true, kitchenType: 'KITCHEN_LIVING' }),
      pricing,
      preview,
    );
    expect(configuration?.gas).toBe(true);
    expect(configuration?.kitchenType).toBe('KITCHEN_LIVING');
  });
});

describe('toConfiguration currency', () => {
  it('uses UAH only when an exchange rate exists', () => {
    const draft = makeInteriorDraft();
    const uah = { mode: 'preview', currency: 'UAH' } as const;
    expect(toConfiguration(draft, pricing, uah)?.currency).toBe('UAH');
    expect(
      toConfiguration(draft, makePricingData({ exchangeRate: null }), uah)
        ?.currency,
    ).toBe('USD');
    expect(toConfiguration(draft, pricing, preview)?.currency).toBe('USD');
  });
});

describe('toConfiguration rooms', () => {
  const valid = makeDraftRoom({ clientId: 'valid' });

  function previewRooms(
    rooms: DraftV1['rooms'],
    kitchenType: DraftV1['object']['kitchenType'] = 'SEPARATE',
  ): string[] {
    const draft = makeInteriorDraft({
      object: { ...makeInteriorDraft().object, kitchenType },
      rooms,
    });
    return (
      toConfiguration(draft, pricing, preview)?.rooms.map(
        (room) => room.clientId,
      ) ?? []
    );
  }

  it('keeps valid rooms and skips incomplete ones in preview', () => {
    const rooms = [
      valid,
      makeDraftRoom({ clientId: 'no-type', roomTypeCode: null }),
      makeDraftRoom({ clientId: 'no-length', lengthM: null }),
      makeDraftRoom({ clientId: 'no-width', widthM: null }),
      makeDraftRoom({ clientId: 'no-height', heightM: null }),
      makeDraftRoom({
        clientId: 'tall',
        heightM: pricing.limits.roomHeightM.max + 1,
      }),
      makeDraftRoom({
        clientId: 'short',
        heightM: pricing.limits.roomHeightM.min - 0.1,
      }),
      makeDraftRoom({
        clientId: 'long',
        lengthM: pricing.limits.roomSideM.max + 1,
      }),
      makeDraftRoom({
        clientId: 'narrow',
        widthM: pricing.limits.roomSideM.min - 0.1,
      }),
    ];
    expect(previewRooms(rooms)).toEqual(['valid']);
  });

  it('skips room types not allowed for the kitchen type', () => {
    const rooms = [
      makeDraftRoom({ clientId: 'living', roomTypeCode: 'LIVING_ROOM' }),
      makeDraftRoom({ clientId: 'kitchen', roomTypeCode: 'KITCHEN' }),
      makeDraftRoom({ clientId: 'kl', roomTypeCode: 'KITCHEN_LIVING' }),
      makeDraftRoom({ clientId: 'bath', roomTypeCode: 'BATHROOM' }),
    ];
    expect(previewRooms(rooms, 'SEPARATE')).toEqual([
      'living',
      'kitchen',
      'bath',
    ]);
    expect(previewRooms(rooms, 'KITCHEN_LIVING')).toEqual(['kl', 'bath']);
  });

  it('returns a configuration with no rooms in preview', () => {
    const draft = makeInteriorDraft({ rooms: [] });
    expect(toConfiguration(draft, pricing, preview)?.rooms).toEqual([]);
  });

  it('never enables heated floor', () => {
    const configuration = toConfiguration(
      makeInteriorDraft(),
      pricing,
      preview,
    );
    expect(configuration?.rooms.map((room) => room.heatedFloor)).toEqual([
      false,
      false,
    ]);
    expect(configuration?.options.map((option) => option.optionId)).toEqual([]);
  });

  it('copies dimensions', () => {
    const [room] =
      toConfiguration(makeInteriorDraft(), pricing, preview)?.rooms ?? [];
    expect([room?.lengthM, room?.widthM, room?.heightM]).toEqual([5, 4, 2.7]);
  });
});

describe('toConfiguration selections', () => {
  function selectionsOf(room: ReturnType<typeof makeDraftRoom>) {
    const draft = makeInteriorDraft({ rooms: [room] });
    return toConfiguration(draft, pricing, preview)?.rooms[0]?.selections;
  }

  it('follows server category order and drops categories outside the draft', () => {
    const selections = selectionsOf(
      makeDraftRoom({
        selections: {
          [categoryIds.ceiling]: {
            productId: productIds.ceilingPaint,
            disabled: false,
            source: 'style',
          },
          [categoryIds.floor]: {
            productId: productIds.laminate,
            disabled: false,
            source: 'manual',
          },
          unknown: { productId: 'x', disabled: false, source: 'manual' },
        },
      }),
    );
    expect(selections).toEqual([
      { categoryId: categoryIds.floor, productId: productIds.laminate },
      { categoryId: categoryIds.ceiling, productId: productIds.ceilingPaint },
    ]);
  });

  it('sends null for disabled selections and for no product', () => {
    const selections = selectionsOf(
      makeDraftRoom({
        selections: {
          [categoryIds.floor]: {
            productId: productIds.laminate,
            disabled: true,
            source: 'manual',
          },
          [categoryIds.walls]: {
            productId: null,
            disabled: false,
            source: 'style',
          },
        },
      }),
    );
    expect(selections).toEqual([
      { categoryId: categoryIds.floor, productId: null },
      { categoryId: categoryIds.walls, productId: null },
    ]);
  });

  it('uses the supplied room type categories, filling gaps with null', () => {
    const draft = makeInteriorDraft({
      rooms: [
        makeDraftRoom({
          selections: {
            [categoryIds.floor]: {
              productId: productIds.laminate,
              disabled: false,
              source: 'style',
            },
          },
        }),
      ],
    });
    const configuration = toConfiguration(draft, pricing, {
      ...preview,
      roomTypeCategories: {
        LIVING_ROOM: [categoryIds.walls, categoryIds.floor],
      },
    });
    expect(configuration?.rooms[0]?.selections).toEqual([
      { categoryId: categoryIds.walls, productId: null },
      { categoryId: categoryIds.floor, productId: productIds.laminate },
    ]);
  });
});

describe('toConfiguration options', () => {
  const rooms = [
    makeDraftRoom({ clientId: 'a' }),
    makeDraftRoom({ clientId: 'b', roomTypeCode: 'BEDROOM' }),
  ];

  function optionsOf(options: DraftV1['options']) {
    const draft = makeInteriorDraft({ rooms, options });
    return toConfiguration(draft, pricing, preview)?.options;
  }

  it('maps each unit', () => {
    expect(
      optionsOf({
        'opt-ac': { quantity: 2 },
        'opt-design': {},
        'opt-smart-switches': { roomClientIds: ['a', 'b'] },
      }),
    ).toEqual([
      { optionId: 'opt-ac', quantity: 2 },
      { optionId: 'opt-design' },
      { optionId: 'opt-smart-switches', roomClientIds: ['a', 'b'] },
    ]);
  });

  it('maps ROOM_SQM options', () => {
    expect(optionsOf({ 'opt-heated-floor': { roomClientIds: ['a'] } })).toEqual(
      [{ optionId: 'opt-heated-floor', roomClientIds: ['a'] }],
    );
  });

  it('drops unknown options, missing rooms and empty lists', () => {
    expect(
      optionsOf({
        missing: {},
        'opt-smart-switches': { roomClientIds: ['gone'] },
        'opt-heated-floor': { roomClientIds: [] },
      }),
    ).toEqual([]);
  });

  it('filters room ids to rooms present in the configuration', () => {
    const draft = makeInteriorDraft({
      rooms: [
        rooms[0] as DraftV1['rooms'][number],
        makeDraftRoom({ clientId: 'bad', lengthM: null }),
      ],
      options: { 'opt-smart-switches': { roomClientIds: ['a', 'bad'] } },
    });
    expect(toConfiguration(draft, pricing, preview)?.options).toEqual([
      { optionId: 'opt-smart-switches', roomClientIds: ['a'] },
    ]);
  });

  it('omits a piece option without quantity', () => {
    expect(optionsOf({ 'opt-ac': {} })).toEqual([]);
  });
});

describe('toConfiguration strict', () => {
  it('returns the configuration for a complete draft', () => {
    const configuration = toConfiguration(makeInteriorDraft(), pricing, strict);
    expect(configuration?.rooms).toHaveLength(2);
  });

  it.each([
    ['no rooms', makeInteriorDraft({ rooms: [] }), 'ROOMS_COUNT'],
    [
      'too many rooms',
      makeInteriorDraft({
        rooms: Array.from({ length: pricing.limits.rooms.max + 1 }, (_, i) =>
          makeDraftRoom({ clientId: `r${i}` }),
        ),
      }),
      'ROOMS_COUNT',
    ],
    [
      'room without type',
      makeInteriorDraft({ rooms: [makeDraftRoom({ roomTypeCode: null })] }),
      'ROOM_TYPE',
    ],
    [
      'room with null dimension',
      makeInteriorDraft({ rooms: [makeDraftRoom({ heightM: null })] }),
      'ROOM_DIMENSIONS',
    ],
    [
      'room type not allowed',
      makeInteriorDraft({
        rooms: [makeDraftRoom({ roomTypeCode: 'KITCHEN_LIVING' })],
      }),
      'ROOM_TYPE_NOT_ALLOWED',
    ],
    ['no style', makeInteriorDraft({ styleId: null }), 'STYLE'],
    ['empty draft', makeEmptyDraft(), 'FINISH_LEVEL'],
  ])('throws for %s', (_, draft, reason) => {
    expect(reasonOf(draft)).toBe(reason);
  });

  it('reports the offending room', () => {
    const draft = makeInteriorDraft({
      rooms: [makeDraftRoom({ clientId: 'bad', widthM: null })],
    });
    try {
      toConfiguration(draft, pricing, strict);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(IncompleteDraftError);
      expect((error as IncompleteDraftError).roomClientId).toBe('bad');
    }
  });
});
