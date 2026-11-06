import { describe, expect, it } from 'vitest';
import {
  categoryIds,
  makeDefaultMaterials,
  makeRoomTypes,
  productIds,
  styleIds,
} from '@/test/fixtures/catalog';
import { makeDraftRoom, makeEmptyDraft } from '@/test/fixtures/draft';
import {
  applyStyle,
  hasManualChanges,
  materialsForRoom,
  retypeSelections,
} from './style';

const roomTypes = makeRoomTypes();
const defaults = makeDefaultMaterials(styleIds.modern);
const manual = (productId: string | null, disabled = false) =>
  ({ productId, disabled, source: 'manual' }) as const;
const fromStyle = (productId: string | null) =>
  ({ productId, disabled: false, source: 'style' }) as const;

describe('materialsForRoom', () => {
  it('fills every category of the room type from the style', () => {
    expect(materialsForRoom('BEDROOM', defaults, roomTypes)).toEqual({
      [categoryIds.floor]: fromStyle(productIds.laminate),
      [categoryIds.walls]: fromStyle(productIds.paint),
      [categoryIds.ceiling]: fromStyle(productIds.ceilingPaint),
    });
  });

  it('uses the room type specific default', () => {
    expect(
      materialsForRoom('BATHROOM', defaults, roomTypes)[categoryIds.floor],
    ).toEqual(fromStyle(productIds.tile));
  });

  it('leaves a category without a default empty', () => {
    const sparse = {
      ...defaults,
      items: defaults.items.map((item) =>
        item.roomTypeCode === 'BEDROOM' && item.categoryId === categoryIds.walls
          ? { ...item, productId: null }
          : item,
      ),
    };

    expect(
      materialsForRoom('BEDROOM', sparse, roomTypes)[categoryIds.walls],
    ).toEqual(fromStyle(null));
  });

  it('leaves a category missing from the defaults empty', () => {
    const none = { ...defaults, items: [] };

    expect(
      materialsForRoom('BEDROOM', none, roomTypes)[categoryIds.floor],
    ).toEqual(fromStyle(null));
  });

  it('returns nothing without a room type', () => {
    expect(materialsForRoom(null, defaults, roomTypes)).toEqual({});
  });

  it('returns nothing for a type missing from the catalog', () => {
    expect(materialsForRoom('BEDROOM', defaults, { items: [] })).toEqual({});
  });
});

describe('partial scope', () => {
  const partialDraft = (selections = {}) =>
    makeEmptyDraft({
      object: { ...makeEmptyDraft().object, scope: 'PARTIAL' },
      rooms: [
        makeDraftRoom({ clientId: 'a', roomTypeCode: 'BEDROOM', selections }),
      ],
    });

  it('materialsForRoom disables every category', () => {
    const result = materialsForRoom('BEDROOM', defaults, roomTypes, 'PARTIAL');

    expect(Object.keys(result)).toHaveLength(3);
    expect(Object.values(result).every((item) => item.disabled)).toBe(true);
    expect(Object.values(result).every((item) => item.productId === null)).toBe(
      true,
    );
  });

  it('applyStyle keeps disabled categories disabled', () => {
    const next = applyStyle(partialDraft(), defaults, roomTypes);

    expect(
      Object.values(next.rooms[0]?.selections ?? {}).every(
        (item) => item.disabled,
      ),
    ).toBe(true);
  });

  it('applyStyle fills only enabled categories', () => {
    const next = applyStyle(
      partialDraft({ [categoryIds.floor]: manual(null) }),
      defaults,
      roomTypes,
    );
    const selections = next.rooms[0]?.selections ?? {};

    expect(selections[categoryIds.floor]).toEqual(
      fromStyle(productIds.laminate),
    );
    expect(selections[categoryIds.walls]?.disabled).toBe(true);
    expect(selections[categoryIds.walls]?.productId).toBeNull();
  });
});

describe('applyStyle', () => {
  it('sets the style and overwrites selections of every room', () => {
    const draft = makeEmptyDraft({
      rooms: [
        makeDraftRoom({
          clientId: 'a',
          roomTypeCode: 'BEDROOM',
          selections: { [categoryIds.floor]: manual(productIds.tile, true) },
        }),
        makeDraftRoom({ clientId: 'b', roomTypeCode: null }),
      ],
    });

    const next = applyStyle(draft, defaults, roomTypes);

    expect(next.styleId).toBe(styleIds.modern);
    expect(next.rooms[0]?.selections[categoryIds.floor]).toEqual(
      fromStyle(productIds.laminate),
    );
    expect(next.rooms[1]?.selections).toEqual({});
    expect(draft.rooms[0]?.selections[categoryIds.floor]?.source).toBe(
      'manual',
    );
  });
});

describe('hasManualChanges', () => {
  it('is false without rooms or with style selections only', () => {
    expect(hasManualChanges(makeEmptyDraft())).toBe(false);
    expect(
      hasManualChanges(
        applyStyle(
          makeEmptyDraft({ rooms: [makeDraftRoom()] }),
          defaults,
          roomTypes,
        ),
      ),
    ).toBe(false);
  });

  it('is true when any selection in any room is manual', () => {
    const draft = makeEmptyDraft({
      rooms: [
        makeDraftRoom({ clientId: 'a' }),
        makeDraftRoom({
          clientId: 'b',
          selections: { [categoryIds.floor]: manual(null) },
        }),
      ],
    });

    expect(hasManualChanges(draft)).toBe(true);
  });
});

describe('retypeSelections', () => {
  const narrowTypes = {
    items: roomTypes.items.map((type) =>
      type.code === 'BATHROOM'
        ? {
            ...type,
            categories: type.categories.filter(
              (category) => category.id !== categoryIds.ceiling,
            ),
          }
        : type,
    ),
  };
  const previous = {
    [categoryIds.floor]: manual(productIds.tile),
    [categoryIds.ceiling]: manual(productIds.ceilingPaint),
  };

  it('keeps selections of shared categories and drops the rest', () => {
    expect(retypeSelections(previous, 'BATHROOM', null, narrowTypes)).toEqual({
      [categoryIds.floor]: manual(productIds.tile),
    });
  });

  it('keeps new categories disabled at partial scope without a style', () => {
    const next = retypeSelections(
      { [categoryIds.floor]: manual(productIds.tile) },
      'BEDROOM',
      null,
      roomTypes,
      'PARTIAL',
    );

    expect(next[categoryIds.floor]).toEqual(manual(productIds.tile));
    expect(
      Object.entries(next)
        .filter(([id]) => id !== categoryIds.floor)
        .every(([, selection]) => selection.disabled),
    ).toBe(true);
    expect(Object.keys(next).length).toBeGreaterThan(1);
  });

  it('adds style defaults for new categories only', () => {
    const next = retypeSelections(
      { [categoryIds.floor]: manual(productIds.tile) },
      'BEDROOM',
      defaults,
      roomTypes,
    );

    expect(next[categoryIds.floor]).toEqual(manual(productIds.tile));
    expect(next[categoryIds.walls]).toEqual(fromStyle(productIds.paint));
  });

  it('replaces style materials with the new type defaults', () => {
    const next = retypeSelections(
      { [categoryIds.floor]: fromStyle(productIds.laminate) },
      'BATHROOM',
      defaults,
      roomTypes,
    );

    expect(next[categoryIds.floor]).toEqual(fromStyle(productIds.tile));
  });

  it('keeps a disabled category disabled with the new type default', () => {
    const next = retypeSelections(
      {
        [categoryIds.floor]: {
          ...fromStyle(productIds.laminate),
          disabled: true,
        },
      },
      'BATHROOM',
      defaults,
      roomTypes,
    );

    expect(next[categoryIds.floor]).toEqual({
      ...fromStyle(productIds.tile),
      disabled: true,
    });
  });

  it('keeps a surface on when its style winner changes with the type', () => {
    const tileWalls = 'category-tile-walls';
    const wallpaper = 'category-wallpaper';
    const base = roomTypes.items[0].categories;
    const walls = base.find((category) => category.id === categoryIds.walls);
    if (!walls) {
      throw new Error('walls category missing');
    }
    const types = {
      items: roomTypes.items.map((type) => {
        if (type.code === 'BATHROOM') {
          return {
            ...type,
            categories: [{ ...walls, id: tileWalls }, ...base],
          };
        }
        if (type.code === 'KITCHEN') {
          return {
            ...type,
            categories: [...base, { ...walls, id: wallpaper }],
          };
        }
        return type;
      }),
    };
    const styleDefaults = {
      ...defaults,
      items: [
        ...defaults.items,
        {
          roomTypeCode: 'BATHROOM' as const,
          categoryId: tileWalls,
          productId: productIds.tile,
        },
        {
          roomTypeCode: 'KITCHEN' as const,
          categoryId: wallpaper,
          productId: productIds.paintPremium,
        },
      ],
    };
    const bathroom = materialsForRoom('BATHROOM', styleDefaults, types);

    const next = retypeSelections(bathroom, 'KITCHEN', styleDefaults, types);

    expect(next[categoryIds.walls]?.disabled).toBe(false);
    expect(next[wallpaper]?.disabled).toBe(true);
  });

  it('keeps a removed surface off after a type change', () => {
    const next = retypeSelections(
      {
        [categoryIds.walls]: { ...fromStyle(productIds.paint), disabled: true },
      },
      'KITCHEN',
      defaults,
      roomTypes,
    );

    expect(next[categoryIds.walls]?.disabled).toBe(true);
    expect(next[categoryIds.floor]?.disabled).toBe(false);
  });

  it('keeps style materials of shared categories without a style', () => {
    expect(
      retypeSelections(
        { [categoryIds.floor]: fromStyle(productIds.laminate) },
        'BATHROOM',
        null,
        roomTypes,
      ),
    ).toEqual({ [categoryIds.floor]: fromStyle(productIds.laminate) });
  });

  it('adds nothing new without a style', () => {
    expect(retypeSelections({}, 'BEDROOM', null, roomTypes)).toEqual({});
  });

  it('clears everything for a missing type', () => {
    expect(retypeSelections(previous, null, defaults, roomTypes)).toEqual({});
  });
});
