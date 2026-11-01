import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDefaultDraft } from '@/lib/draft/schema';
import { breakStorage, resetThemeDom } from '@/lib/theme/test-utils';
import {
  categoryIds,
  makeDefaultMaterials,
  makeRoomTypes,
  productIds,
  styleIds,
} from '@/test/fixtures/catalog';
import { DRAFT_STORAGE_KEY, useDraft } from './draft';

const stored = () => {
  const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
  return raw === null ? null : JSON.parse(raw);
};

const seed = (state: unknown, version = 1) =>
  window.localStorage.setItem(
    DRAFT_STORAGE_KEY,
    JSON.stringify({ state, version }),
  );

beforeEach(() => {
  vi.restoreAllMocks();
  resetThemeDom();
  useDraft.setState({
    ...createDefaultDraft(),
    revision: 0,
    storageAvailable: true,
    notice: null,
  });
});

describe('useDraft', () => {
  it('persists only the draft', () => {
    useDraft.getState().setStep('style');

    expect(stored()).toEqual({
      state: { ...createDefaultDraft(), step: 'style', furthestStep: 'style' },
      version: 1,
    });
  });

  it('keeps step and data after a reload', async () => {
    useDraft.setState({ styleId: 'modern' });
    useDraft.getState().setStep('interior');
    const saved = window.localStorage.getItem(DRAFT_STORAGE_KEY) ?? '';
    useDraft.setState(createDefaultDraft());
    window.localStorage.setItem(DRAFT_STORAGE_KEY, saved);

    await useDraft.persist.rehydrate();

    expect(useDraft.getState().step).toBe('interior');
    expect(useDraft.getState().styleId).toBe('modern');
    expect(useDraft.getState().notice).toBeNull();
  });

  it('does not move furthestStep back', () => {
    useDraft.getState().setStep('interior');
    useDraft.getState().setStep('object');

    expect(useDraft.getState().step).toBe('object');
    expect(useDraft.getState().furthestStep).toBe('interior');
  });

  it('increments revision on every change', () => {
    useDraft.getState().setStep('style');
    useDraft.getState().reset();

    expect(useDraft.getState().revision).toBe(2);
  });

  it('dismisses the notice without touching the draft revision', () => {
    useDraft.setState({ notice: 'draftReset' });
    useDraft.getState().dismissNotice();

    expect(useDraft.getState().notice).toBeNull();
    expect(useDraft.getState().revision).toBe(0);
  });

  it('resets to the default draft', () => {
    useDraft.getState().setStep('result');
    useDraft.getState().reset();

    expect(useDraft.getState().step).toBe('object');
    expect(stored().state).toEqual(createDefaultDraft());
  });

  it('salvages valid fields from a damaged draft of the same version', async () => {
    seed({
      ...createDefaultDraft(),
      step: 'style',
      furthestStep: 'style',
      rooms: 'garbage',
    });

    await useDraft.persist.rehydrate();

    expect(useDraft.getState().step).toBe('style');
    expect(useDraft.getState().rooms).toEqual([]);
    expect(useDraft.getState().notice).toBeNull();
  });

  it('resets with a notice when the stored draft is not valid JSON', async () => {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, '{"state":');

    await useDraft.persist.rehydrate();

    expect(useDraft.getState().step).toBe('object');
    expect(useDraft.getState().notice).toBe('draftReset');
  });

  it('resets with a notice when nothing can be recovered', async () => {
    seed({ nonsense: true });

    await useDraft.persist.rehydrate();

    expect(useDraft.getState().step).toBe('object');
    expect(useDraft.getState().notice).toBe('draftReset');
  });

  it('salvages a draft from a newer version', async () => {
    seed({ ...createDefaultDraft(), step: 'style', furthestStep: 'style' }, 7);

    await useDraft.persist.rehydrate();

    expect(useDraft.getState().step).toBe('style');
  });

  it('resets with a notice for an unrecoverable newer version', async () => {
    seed('junk', 7);

    await useDraft.persist.rehydrate();

    expect(useDraft.getState().notice).toBe('draftReset');
  });

  it('keeps working when storage is unavailable', async () => {
    breakStorage('getItem');
    breakStorage('setItem');

    useDraft.getState().setStep('style');
    await useDraft.persist.rehydrate();

    expect(useDraft.getState().step).toBe('style');
    expect(useDraft.getState().storageAvailable).toBe(false);
  });
});

describe('useDraft room actions', () => {
  const rooms = () => useDraft.getState().rooms;

  it('merges a patch into the object without touching rooms', () => {
    const id = useDraft.getState().addRoom();
    useDraft.getState().setObject({ totalAreaSqm: 60, gas: true });
    useDraft.getState().setObject({ kitchenType: 'KITCHEN_LIVING' });

    expect(useDraft.getState().object).toMatchObject({
      totalAreaSqm: 60,
      gas: true,
      kitchenType: 'KITCHEN_LIVING',
    });
    expect(rooms()).toHaveLength(1);
    expect(rooms()[0]?.clientId).toBe(id);
    expect(rooms()[0]?.roomTypeCode).toBe('LIVING_ROOM');
  });

  it('adds a room and returns its id', () => {
    const id = useDraft.getState().addRoom();

    expect(id).not.toBeNull();
    expect(rooms()).toHaveLength(1);
    expect(rooms()[0]).toMatchObject({ clientId: id, name: null });
    expect(useDraft.getState().revision).toBe(1);
  });

  it('returns null and changes nothing at the room limit', () => {
    for (let i = 0; i < 50; i++) {
      useDraft.getState().addRoom();
    }

    expect(useDraft.getState().addRoom()).toBeNull();
    expect(rooms()).toHaveLength(50);
  });

  it('updates only the patched fields of the given room', () => {
    const first = useDraft.getState().addRoom() as string;
    const second = useDraft.getState().addRoom() as string;
    useDraft.getState().updateRoom(second, {
      roomTypeCode: 'BATHROOM',
      lengthM: 3,
      widthM: 2,
      heightM: 2.7,
    });

    expect(rooms().find((r) => r.clientId === second)).toMatchObject({
      roomTypeCode: 'BATHROOM',
      lengthM: 3,
      widthM: 2,
      heightM: 2.7,
    });
    expect(rooms().find((r) => r.clientId === first)?.lengthM).toBeNull();
  });

  it('renames a room and clears a blank name', () => {
    const id = useDraft.getState().addRoom() as string;
    useDraft.getState().renameRoom(id, '  Study ');
    expect(rooms()[0]?.name).toBe('Study');

    useDraft.getState().renameRoom(id, '   ');
    expect(rooms()[0]?.name).toBeNull();
  });

  it('removes a room and cleans options that referenced it', () => {
    const first = useDraft.getState().addRoom() as string;
    const second = useDraft.getState().addRoom() as string;
    useDraft.setState({
      options: {
        only: { roomClientIds: [first] },
        both: { roomClientIds: [first, second] },
        global: { quantity: 2 },
      },
    });
    useDraft.getState().removeRoom(first);

    expect(rooms().map((r) => r.clientId)).toEqual([second]);
    expect(useDraft.getState().options).toEqual({
      both: { roomClientIds: [second] },
      global: { quantity: 2 },
    });
  });
});

describe('useDraft style actions', () => {
  const roomTypes = makeRoomTypes();
  const defaults = makeDefaultMaterials(styleIds.modern);
  const catalog = { defaultMaterials: defaults, roomTypes };
  const rooms = () => useDraft.getState().rooms;
  const manual = (productId: string) =>
    ({ productId, disabled: false, source: 'manual' }) as const;

  it('selects a style and fills every room, bumping revision', () => {
    useDraft.getState().addRoom();
    useDraft.setState({
      rooms: [
        {
          ...rooms()[0]!,
          selections: { [categoryIds.floor]: manual(productIds.tile) },
        },
      ],
    });

    useDraft.getState().selectStyle(defaults, roomTypes);

    expect(useDraft.getState().styleId).toBe(styleIds.modern);
    expect(rooms()[0]?.selections[categoryIds.floor]).toEqual({
      productId: productIds.laminate,
      disabled: false,
      source: 'style',
    });
    expect(useDraft.getState().revision).toBe(2);
  });

  it('gives a new room the style materials when a style is chosen', () => {
    useDraft.getState().selectStyle(defaults, roomTypes);
    useDraft.getState().addRoom(catalog);

    expect(rooms()[0]?.selections[categoryIds.walls]?.productId).toBe(
      productIds.paint,
    );
  });

  it('adds an empty room without a style or catalog', () => {
    useDraft.getState().addRoom(catalog);
    useDraft.getState().selectStyle(defaults, roomTypes);
    useDraft.getState().clearStyle();
    useDraft.getState().addRoom(catalog);

    expect(rooms()[0]?.selections).not.toEqual({});
    expect(rooms()[1]?.selections).toEqual({});
  });

  it('refits selections when the room type changes', () => {
    useDraft.getState().selectStyle(defaults, roomTypes);
    const id = useDraft.getState().addRoom(catalog) as string;
    useDraft.setState({
      rooms: [
        {
          ...rooms()[0]!,
          selections: {
            [categoryIds.floor]: manual(productIds.tile),
            stale: manual(productIds.tile),
          },
        },
      ],
    });

    useDraft.getState().updateRoom(id, { roomTypeCode: 'BATHROOM' }, catalog);

    const selections = rooms()[0]?.selections;
    expect(selections?.stale).toBeUndefined();
    expect(selections?.[categoryIds.floor]).toEqual(manual(productIds.tile));
    expect(selections?.[categoryIds.walls]?.productId).toBe(productIds.paint);
  });

  it('keeps selections when other fields change or no catalog is given', () => {
    useDraft.getState().selectStyle(defaults, roomTypes);
    const id = useDraft.getState().addRoom(catalog) as string;
    const before = rooms()[0]?.selections;

    useDraft.getState().updateRoom(id, { lengthM: 4 }, catalog);
    useDraft.getState().updateRoom(id, { roomTypeCode: 'BEDROOM' });

    expect(rooms()[0]?.selections).toEqual(before);
  });

  it('adds no new entries on retype without a style', () => {
    const id = useDraft.getState().addRoom() as string;

    useDraft.getState().updateRoom(id, { roomTypeCode: 'BEDROOM' }, catalog);

    expect(rooms()[0]?.selections).toEqual({});
  });

  it('clears the style but keeps selections', () => {
    useDraft.getState().selectStyle(defaults, roomTypes);
    useDraft.getState().addRoom(catalog);
    const before = rooms();

    useDraft.getState().clearStyle();

    expect(useDraft.getState().styleId).toBeNull();
    expect(rooms()).toEqual(before);
  });
});

describe('useDraft selection actions', () => {
  const roomTypes = makeRoomTypes();
  const defaults = makeDefaultMaterials(styleIds.modern);
  const catalog = { defaultMaterials: defaults, roomTypes };
  const selection = () =>
    useDraft.getState().rooms[0]?.selections[categoryIds.floor];
  let roomId = '';

  beforeEach(() => {
    useDraft.getState().selectStyle(defaults, roomTypes);
    roomId = useDraft.getState().addRoom(catalog) ?? '';
  });

  it('selects a product as manual and replaces the previous one', () => {
    useDraft
      .getState()
      .selectProduct(roomId, categoryIds.floor, productIds.tile);

    expect(selection()).toEqual({
      productId: productIds.tile,
      disabled: false,
      source: 'manual',
    });
  });

  it('re-enables a disabled category when a product is selected', () => {
    useDraft.getState().disableCategory(roomId, categoryIds.floor);
    useDraft
      .getState()
      .selectProduct(roomId, categoryIds.floor, productIds.tile);

    expect(selection()?.disabled).toBe(false);
  });

  it('disables a category but keeps its product', () => {
    useDraft.getState().disableCategory(roomId, categoryIds.floor);

    expect(selection()).toEqual({
      productId: productIds.laminate,
      disabled: true,
      source: 'style',
    });
  });

  it('restores the product when the category is enabled again', () => {
    useDraft
      .getState()
      .selectProduct(roomId, categoryIds.floor, productIds.tile);
    useDraft.getState().disableCategory(roomId, categoryIds.floor);
    useDraft.getState().enableCategory(roomId, categoryIds.floor);

    expect(selection()).toEqual({
      productId: productIds.tile,
      disabled: false,
      source: 'manual',
    });
  });

  it('ignores an unknown room but still bumps revision', () => {
    const before = useDraft.getState().rooms;
    const revision = useDraft.getState().revision;

    useDraft
      .getState()
      .selectProduct('missing', categoryIds.floor, productIds.tile);
    useDraft.getState().disableCategory('missing', categoryIds.floor);
    useDraft.getState().enableCategory('missing', categoryIds.floor);

    expect(useDraft.getState().rooms).toEqual(before);
    expect(useDraft.getState().revision).toBe(revision + 3);
  });

  it('increments revision on every action', () => {
    const revision = useDraft.getState().revision;

    useDraft
      .getState()
      .selectProduct(roomId, categoryIds.floor, productIds.tile);
    useDraft.getState().disableCategory(roomId, categoryIds.floor);
    useDraft.getState().enableCategory(roomId, categoryIds.floor);

    expect(useDraft.getState().revision).toBe(revision + 3);
  });
});

describe('useDraft one finish per surface', () => {
  const wallpaperId = 'cat-wallpaper';
  const base = makeRoomTypes();
  const wallpaper = {
    ...base.items[0].categories[1],
    id: wallpaperId,
    name: 'Wallpaper',
  };
  const roomTypes = {
    items: base.items.map((type) => {
      const [floor, walls, ceiling] = type.categories;
      return { ...type, categories: [floor, walls, wallpaper, ceiling] };
    }),
  };
  const defaults = makeDefaultMaterials(styleIds.modern);
  const withWallpaper = {
    ...defaults,
    items: [
      ...defaults.items,
      ...(['LIVING_ROOM', 'BEDROOM'] as const).map((roomTypeCode) => ({
        roomTypeCode,
        categoryId: wallpaperId,
        productId: productIds.paintPremium,
      })),
    ],
  };
  const catalog = { defaultMaterials: withWallpaper, roomTypes };
  const selections = () => useDraft.getState().rooms[0]?.selections ?? {};
  let roomId = '';

  beforeEach(() => {
    useDraft.getState().selectStyle(withWallpaper, roomTypes);
    roomId = useDraft.getState().addRoom(catalog) ?? '';
  });

  it('applies a style with only the first finish of a surface enabled', () => {
    expect(selections()[categoryIds.walls]?.disabled).toBe(false);
    expect(selections()[wallpaperId]).toEqual({
      productId: productIds.paintPremium,
      disabled: true,
      source: 'style',
    });
  });

  it('disables the sibling when a product is selected', () => {
    useDraft
      .getState()
      .selectProduct(roomId, wallpaperId, productIds.paintPremium, [
        categoryIds.walls,
      ]);

    expect(selections()[wallpaperId]?.disabled).toBe(false);
    expect(selections()[categoryIds.walls]).toMatchObject({
      productId: productIds.paint,
      disabled: true,
    });
  });

  it('disables the sibling when a category is enabled again', () => {
    useDraft
      .getState()
      .enableCategory(roomId, wallpaperId, [categoryIds.walls]);

    expect(selections()[wallpaperId]?.disabled).toBe(false);
    expect(selections()[categoryIds.walls]?.disabled).toBe(true);
  });

  it('normalises a stored draft with two finishes on one surface', () => {
    useDraft.setState({
      rooms: useDraft.getState().rooms.map((room) => ({
        ...room,
        selections: Object.fromEntries(
          Object.entries(room.selections).map(([id, selection]) => [
            id,
            { ...selection, disabled: false },
          ]),
        ),
      })),
    });

    useDraft.getState().normalizeSurfaces(roomTypes);

    expect(selections()[categoryIds.walls]?.disabled).toBe(false);
    expect(selections()[wallpaperId]?.disabled).toBe(true);
  });

  it('leaves the revision alone when nothing needs normalising', () => {
    const revision = useDraft.getState().revision;

    useDraft.getState().normalizeSurfaces(roomTypes);

    expect(useDraft.getState().revision).toBe(revision);
  });
});
