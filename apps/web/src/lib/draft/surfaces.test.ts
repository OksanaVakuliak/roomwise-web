import { describe, expect, it } from 'vitest';
import { makeDraftRoom, makeEmptyDraft } from '@/test/fixtures/draft';
import type { DraftSelection } from './schema';
import type { RoomTypesCatalog } from './style';
import {
  activateFirstPerSurface,
  categoriesOfRoomType,
  enabledCategoryOf,
  groupCategories,
  normalizeDraft,
  normalizeSelections,
  type SurfaceCategory,
  surfaceSiblings,
} from './surfaces';

const categories: SurfaceCategory[] = [
  { id: 'floor', surface: 'FLOOR' },
  { id: 'paint', surface: 'WALLS' },
  { id: 'wallpaper', surface: 'WALLS' },
  { id: 'ceiling', surface: 'CEILING' },
  { id: 'skirting', surface: 'NONE' },
  { id: 'doors', surface: 'NONE' },
];

const on = (
  productId: string | null,
  source: DraftSelection['source'] = 'style',
): DraftSelection => ({ productId, disabled: false, source });
const off = (
  productId: string | null,
  source: DraftSelection['source'] = 'style',
): DraftSelection => ({ productId, disabled: true, source });

describe('surfaceSiblings', () => {
  it('returns the other categories of the same surface', () => {
    expect(surfaceSiblings(categories, 'paint')).toEqual(['wallpaper']);
    expect(surfaceSiblings(categories, 'wallpaper')).toEqual(['paint']);
  });

  it('returns nothing for a lone surface category', () => {
    expect(surfaceSiblings(categories, 'floor')).toEqual([]);
  });

  it('returns nothing for a category without a surface', () => {
    expect(surfaceSiblings(categories, 'skirting')).toEqual([]);
  });

  it('returns nothing for an unknown category', () => {
    expect(surfaceSiblings(categories, 'missing')).toEqual([]);
  });
});

describe('groupCategories', () => {
  it('orders floor, walls, ceiling and then each independent category', () => {
    const shuffled = [...categories].reverse();

    expect(groupCategories(shuffled).map((group) => group.key)).toEqual([
      'FLOOR',
      'WALLS',
      'CEILING',
      'doors',
      'skirting',
    ]);
  });

  it('collects the categories of a surface in their order', () => {
    const walls = groupCategories(categories).find(
      (group) => group.key === 'WALLS',
    );

    expect(walls?.categories.map((category) => category.id)).toEqual([
      'paint',
      'wallpaper',
    ]);
  });

  it('skips surfaces without categories', () => {
    expect(
      groupCategories([{ id: 'floor', surface: 'FLOOR' }]).map(
        (group) => group.key,
      ),
    ).toEqual(['FLOOR']);
  });
});

describe('enabledCategoryOf', () => {
  const walls = groupCategories(categories)[1];

  it('returns the enabled category of the group', () => {
    expect(
      enabledCategoryOf(walls, { paint: off('p'), wallpaper: on('w') })?.id,
    ).toBe('wallpaper');
  });

  it('returns nothing when the whole group is excluded', () => {
    expect(
      enabledCategoryOf(walls, { paint: off('p'), wallpaper: off('w') }),
    ).toBeUndefined();
  });
});

describe('activateFirstPerSurface', () => {
  it('enables only the first category with a product per surface', () => {
    const result = activateFirstPerSurface(
      {
        floor: on('f'),
        paint: on('p'),
        wallpaper: on('w'),
        ceiling: on('c'),
        skirting: on('s'),
      },
      categories,
    );

    expect(result.paint).toEqual(on('p'));
    expect(result.wallpaper).toEqual(off('w'));
    expect(result.skirting).toEqual(on('s'));
  });

  it('skips a leading category that has no default product', () => {
    const result = activateFirstPerSurface(
      { paint: on(null), wallpaper: on('w') },
      categories,
    );

    expect(result.paint).toEqual(off(null));
    expect(result.wallpaper).toEqual(on('w'));
  });

  it('keeps the first category active when none has a product', () => {
    const result = activateFirstPerSurface(
      { paint: on(null), wallpaper: on(null) },
      categories,
    );

    expect(result.paint).toEqual(on(null));
    expect(result.wallpaper).toEqual(off(null));
  });
});

describe('normalizeSelections', () => {
  it('keeps the first enabled category of a surface', () => {
    const result = normalizeSelections(
      { paint: on('p'), wallpaper: on('w'), floor: on('f') },
      categories,
    );

    expect(result.paint).toEqual(on('p'));
    expect(result.wallpaper).toEqual(off('w'));
    expect(result.floor).toEqual(on('f'));
  });

  it('prefers a manual choice over an earlier style default', () => {
    const result = normalizeSelections(
      { paint: on('p'), wallpaper: on('w', 'manual') },
      categories,
    );

    expect(result.paint).toEqual(off('p'));
    expect(result.wallpaper).toEqual(on('w', 'manual'));
  });

  it('keeps one covering and strips the share on a ceiling', () => {
    const withCeilings: SurfaceCategory[] = [
      { id: 'ceilingPaint', surface: 'CEILING' },
      { id: 'ceilingPanels', surface: 'CEILING' },
    ];
    const result = normalizeSelections(
      {
        ceilingPaint: { ...on('a'), areaShare: 50 },
        ceilingPanels: { ...on('b'), areaShare: 50 },
      },
      withCeilings,
    );

    expect(result.ceilingPaint).toEqual(on('a'));
    expect(result.ceilingPanels).toEqual({ ...off('b') });
  });

  it('keeps every shared covering on walls', () => {
    const result = normalizeSelections(
      {
        paint: { ...on('p'), areaShare: 60 },
        wallpaper: { ...on('w'), areaShare: 40 },
      },
      categories,
    );

    expect(result.paint?.areaShare).toBe(60);
    expect(result.wallpaper).toEqual({ ...on('w'), areaShare: 40 });
  });

  it('leaves a fully excluded surface alone', () => {
    const selections = { paint: off('p'), wallpaper: off('w') };

    expect(normalizeSelections(selections, categories)).toBe(selections);
  });

  it('returns the same object when nothing changes', () => {
    const selections = {
      paint: on('p'),
      wallpaper: off('w'),
      skirting: on('s'),
    };

    expect(normalizeSelections(selections, categories)).toBe(selections);
  });
});

describe('normalizeSelections with area shares', () => {
  const shared = (productId: string, areaShare: number): DraftSelection => ({
    ...on(productId, 'manual'),
    areaShare,
  });
  const walls: SurfaceCategory[] = [
    ...categories,
    { id: 'panels', surface: 'WALLS' },
  ];

  it('keeps every shared covering of a surface enabled', () => {
    const selections = {
      paint: shared('p1', 60),
      wallpaper: shared('p2', 40),
    };

    expect(normalizeSelections(selections, walls)).toBe(selections);
  });

  it('disables an enabled covering without a share on a shared surface', () => {
    const result = normalizeSelections(
      {
        paint: shared('p1', 60),
        wallpaper: shared('p2', 40),
        panels: on('p3', 'manual'),
      },
      walls,
    );

    expect(result.panels?.disabled).toBe(true);
    expect(result.paint?.disabled).toBe(false);
    expect(result.wallpaper?.disabled).toBe(false);
  });

  it('falls back to one winner when only one covering is shared', () => {
    const result = normalizeSelections(
      { paint: shared('p1', 60), wallpaper: on('p2', 'style') },
      categories,
    );

    expect(result.paint).toEqual(on('p1', 'manual'));
    expect(result.wallpaper).toEqual(off('p2', 'style'));
  });

  it('drops the share of a lone enabled covering', () => {
    const result = normalizeSelections(
      { paint: shared('p1', 60), wallpaper: off('p2') },
      categories,
    );

    expect(result.paint).toEqual(on('p1', 'manual'));
  });
});

describe('activateFirstPerSurface with area shares', () => {
  it('strips the share from the coverings it disables', () => {
    const result = activateFirstPerSurface(
      {
        paint: { ...on('p1'), areaShare: 50 },
        wallpaper: { ...on('p2'), areaShare: 50 },
      },
      categories,
    );

    expect(result.paint?.disabled).toBe(false);
    expect(result.wallpaper).toEqual(off('p2'));
  });
});

describe('normalizeDraft', () => {
  const roomTypes = {
    items: [
      {
        id: 'rt',
        code: 'BEDROOM',
        name: 'Bedroom',
        categories: categories.map((category) => ({
          ...category,
          name: category.id,
          wastePercent: 5,
          productCount: 1,
        })),
      },
    ],
  } as RoomTypesCatalog;

  it('disables duplicate finishes of a surface in every room', () => {
    const draft = makeEmptyDraft({
      rooms: [
        makeDraftRoom({
          roomTypeCode: 'BEDROOM',
          selections: { paint: on('p'), wallpaper: on('w') },
        }),
      ],
    });

    const result = normalizeDraft(draft, roomTypes);

    expect(result.rooms[0].selections).toEqual({
      paint: on('p'),
      wallpaper: off('w'),
    });
  });

  it('returns the same draft when it is already consistent', () => {
    const draft = makeEmptyDraft({
      rooms: [
        makeDraftRoom({
          roomTypeCode: 'BEDROOM',
          selections: { paint: on('p'), wallpaper: off('w') },
        }),
      ],
    });

    expect(normalizeDraft(draft, roomTypes)).toBe(draft);
  });

  it('drops the share left alone on a surface', () => {
    const draft = makeEmptyDraft({
      rooms: [
        makeDraftRoom({
          roomTypeCode: 'BEDROOM',
          selections: { paint: { ...on('p'), areaShare: 100 } },
        }),
      ],
    });

    expect(normalizeDraft(draft, roomTypes).rooms[0].selections).toEqual({
      paint: on('p'),
    });
  });

  it('ignores a room whose type is unknown to the catalog', () => {
    const draft = makeEmptyDraft({
      rooms: [
        makeDraftRoom({
          roomTypeCode: 'KITCHEN',
          selections: { paint: on('p'), wallpaper: on('w') },
        }),
      ],
    });

    expect(normalizeDraft(draft, roomTypes)).toBe(draft);
  });
});

describe('categoriesOfRoomType', () => {
  it('returns an empty list for a missing type', () => {
    expect(categoriesOfRoomType(null, { items: [] })).toEqual([]);
  });
});
