import { describe, expect, it } from 'vitest';
import { makeDraftRoom, makeEmptyDraft } from '@/test/fixtures/draft';
import type { DraftSelection, DraftV1 } from './schema';
import { disableCategory, selectProduct } from './selections';
import {
  addCovering,
  removeCovering,
  setAreaShare,
  shareSurfaceOf,
} from './shares';
import { hasManualChanges } from './style';
import type { SurfaceCategory } from './surfaces';

const categories: SurfaceCategory[] = [
  { id: 'floor', surface: 'FLOOR' },
  { id: 'paint', surface: 'WALLS' },
  { id: 'wallpaper', surface: 'WALLS' },
  { id: 'panels', surface: 'WALLS' },
  { id: 'ceiling', surface: 'CEILING' },
  { id: 'doors', surface: 'NONE' },
];

const ROOM = 'room-1';

const on = (productId: string | null, areaShare?: number): DraftSelection => ({
  productId,
  disabled: false,
  source: 'manual',
  ...(areaShare !== undefined && { areaShare }),
});
const off = (productId: string | null): DraftSelection => ({
  productId,
  disabled: true,
  source: 'manual',
});

function draftOf(selections: Record<string, DraftSelection>): DraftV1 {
  return makeEmptyDraft({
    rooms: [makeDraftRoom({ clientId: ROOM, selections })],
  });
}

function selectionsOf(draft: DraftV1) {
  return draft.rooms[0]?.selections ?? {};
}

describe('shareSurfaceOf', () => {
  it('knows walls and floor only', () => {
    expect(shareSurfaceOf(categories, 'paint')).toBe('WALLS');
    expect(shareSurfaceOf(categories, 'floor')).toBe('FLOOR');
    expect(shareSurfaceOf(categories, 'ceiling')).toBeNull();
    expect(shareSurfaceOf(categories, 'doors')).toBeNull();
    expect(shareSurfaceOf(categories, 'missing')).toBeNull();
  });
});

describe('addCovering', () => {
  const add = (draft: DraftV1, categoryId: string) =>
    selectionsOf(addCovering(draft, ROOM, categoryId, categories));

  it('splits a lone covering fifty-fifty with the new one', () => {
    const next = add(
      draftOf({ paint: on('p1'), wallpaper: off('p2') }),
      'wallpaper',
    );

    expect(next.paint).toEqual(on('p1', 50));
    expect(next.wallpaper).toEqual(on('p2', 50));
  });

  it('creates an empty selection when the category has none', () => {
    const next = add(draftOf({ paint: on('p1') }), 'wallpaper');

    expect(next.wallpaper).toEqual({
      productId: null,
      disabled: false,
      source: 'manual',
      areaShare: 50,
    });
  });

  it('takes half of the largest share when already shared', () => {
    const next = add(
      draftOf({
        paint: on('p1', 70),
        wallpaper: on('p2', 30),
        panels: off(null),
      }),
      'panels',
    );

    expect(next.paint?.areaShare).toBe(35);
    expect(next.wallpaper?.areaShare).toBe(30);
    expect(next.panels?.areaShare).toBe(35);
  });

  it('leaves the odd percent with the covering that keeps the rest', () => {
    const next = add(
      draftOf({
        paint: on('p1', 51),
        wallpaper: on('p2', 49),
        panels: off(null),
      }),
      'panels',
    );

    expect(next.paint?.areaShare).toBe(26);
    expect(next.panels?.areaShare).toBe(25);
  });

  it('gives the new covering the unallocated remainder', () => {
    const next = add(
      draftOf({
        paint: on('p1', 30),
        wallpaper: on('p2', 20),
        panels: off(null),
      }),
      'panels',
    );

    expect(next.paint?.areaShare).toBe(30);
    expect(next.wallpaper?.areaShare).toBe(20);
    expect(next.panels?.areaShare).toBe(50);
  });

  it('splits the largest share when the shares already add up to 100 or more', () => {
    const next = add(
      draftOf({
        paint: on('p1', 100),
        wallpaper: on('p2', 1),
        panels: off(null),
      }),
      'panels',
    );

    expect(next.paint?.areaShare).toBe(50);
    expect(next.wallpaper?.areaShare).toBe(1);
    expect(next.panels?.areaShare).toBe(50);
  });

  it('keeps the sum of shares at 100', () => {
    const next = add(
      draftOf({
        paint: on('p1', 60),
        wallpaper: on('p2', 40),
        panels: off(null),
      }),
      'panels',
    );
    const sum = ['paint', 'wallpaper', 'panels'].reduce(
      (total, id) => total + (next[id]?.areaShare ?? 0),
      0,
    );

    expect(sum).toBe(100);
  });

  it('does not touch other surfaces', () => {
    const next = add(
      draftOf({ floor: on('f1'), paint: on('p1'), wallpaper: off('p2') }),
      'wallpaper',
    );

    expect(next.floor).toEqual(on('f1'));
  });

  it('does nothing for a ceiling or independent category', () => {
    const draft = draftOf({ ceiling: on('c1'), doors: off(null) });

    expect(addCovering(draft, ROOM, 'ceiling', categories)).toBe(draft);
    expect(addCovering(draft, ROOM, 'doors', categories)).toBe(draft);
  });

  it('does nothing for a covering that is already shared', () => {
    const draft = draftOf({ paint: on('p1', 50), wallpaper: on('p2', 50) });

    expect(add(draft, 'wallpaper')).toEqual(selectionsOf(draft));
  });

  it('leaves other rooms alone', () => {
    const base = draftOf({ paint: on('p1'), wallpaper: off('p2') });
    const other = makeDraftRoom({ clientId: 'room-2' });
    const draft = { ...base, rooms: [...base.rooms, other] };

    expect(addCovering(draft, ROOM, 'wallpaper', categories).rooms[1]).toBe(
      other,
    );
  });
});

describe('manual source after share edits', () => {
  const styled = (productId: string | null, areaShare?: number) => ({
    ...on(productId, areaShare),
    source: 'style' as const,
  });

  it('marks an added covering and the one it splits with as manual', () => {
    const draft = draftOf({
      paint: styled('p1'),
      wallpaper: { ...off('p2'), source: 'style' },
    });
    expect(hasManualChanges(draft)).toBe(false);

    const next = addCovering(draft, ROOM, 'wallpaper', categories);

    expect(hasManualChanges(next)).toBe(true);
    expect(selectionsOf(next).paint?.source).toBe('manual');
    expect(selectionsOf(next).wallpaper?.source).toBe('manual');
  });

  it('marks the donor of an added covering as manual', () => {
    const draft = draftOf({
      paint: styled('p1', 60),
      wallpaper: styled('p2', 40),
      panels: { ...off('p3'), source: 'style' },
    });

    const next = selectionsOf(addCovering(draft, ROOM, 'panels', categories));

    expect(next.paint?.source).toBe('manual');
  });

  it('marks an edited share as manual', () => {
    const draft = draftOf({ paint: styled('p1', 50) });

    const next = setAreaShare(draft, ROOM, 'paint', 30);

    expect(selectionsOf(next).paint?.source).toBe('manual');
  });
});

describe('setAreaShare', () => {
  const draft = draftOf({ paint: on('p1', 50) });
  const share = (percent: number) =>
    selectionsOf(setAreaShare(draft, ROOM, 'paint', percent)).paint?.areaShare;

  it('rounds and clamps to 1-100', () => {
    expect(share(33.6)).toBe(34);
    expect(share(0)).toBe(1);
    expect(share(-5)).toBe(1);
    expect(share(150)).toBe(100);
  });

  it('ignores an unknown category', () => {
    expect(selectionsOf(setAreaShare(draft, ROOM, 'wallpaper', 40))).toEqual(
      selectionsOf(draft),
    );
  });
});

describe('removeCovering', () => {
  it('disables the covering and drops the shares of a lone survivor', () => {
    const next = selectionsOf(
      removeCovering(
        draftOf({ paint: on('p1', 60), wallpaper: on('p2', 40) }),
        ROOM,
        'wallpaper',
        categories,
      ),
    );

    expect(next.wallpaper).toEqual(off('p2'));
    expect(next.paint).toEqual(on('p1'));
  });

  it('keeps the remaining shares while two or more stay', () => {
    const next = selectionsOf(
      removeCovering(
        draftOf({
          paint: on('p1', 50),
          wallpaper: on('p2', 30),
          panels: on('p3', 20),
        }),
        ROOM,
        'panels',
        categories,
      ),
    );

    expect(next.panels).toEqual(off('p3'));
    expect(next.paint?.areaShare).toBe(50);
    expect(next.wallpaper?.areaShare).toBe(30);
  });
});

describe('disableCategory on a shared covering', () => {
  const shared = draftOf({ paint: on('p1', 60), wallpaper: on('p2', 40) });

  it('behaves like removeCovering when categories are given', () => {
    const next = selectionsOf(
      disableCategory(shared, ROOM, 'wallpaper', categories),
    );

    expect(next.wallpaper).toEqual(off('p2'));
    expect(next.paint).toEqual(on('p1'));
  });

  it('drops only its own share when no categories are known', () => {
    const next = selectionsOf(disableCategory(shared, ROOM, 'wallpaper', []));

    expect(next.wallpaper).toEqual(off('p2'));
    expect(next.paint).toEqual(on('p1', 60));
  });

  it('is unchanged for a plain covering', () => {
    expect(
      selectionsOf(
        disableCategory(
          draftOf({ paint: on('p1') }),
          ROOM,
          'paint',
          categories,
        ),
      ),
    ).toEqual({ paint: off('p1') });
  });
});

describe('selectProduct with shared coverings', () => {
  it('keeps shared siblings enabled and the own share', () => {
    const next = selectionsOf(
      selectProduct(
        draftOf({ paint: on('p1', 60), wallpaper: on('p2', 40) }),
        ROOM,
        'paint',
        'p9',
        ['wallpaper', 'panels'],
      ),
    );

    expect(next.paint).toEqual(on('p9', 60));
    expect(next.wallpaper).toEqual(on('p2', 40));
  });

  it('still replaces siblings for a plain covering', () => {
    const next = selectionsOf(
      selectProduct(
        draftOf({ paint: on('p1'), wallpaper: off('p2') }),
        ROOM,
        'wallpaper',
        'p3',
        ['paint'],
      ),
    );

    expect(next.wallpaper).toEqual(on('p3'));
    expect(next.paint).toEqual(off('p1'));
  });
});
