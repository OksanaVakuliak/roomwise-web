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
import { makeDraftRoom } from '@/test/fixtures/draft';
import { makePricingData } from '@/test/fixtures/pricing-data';
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
    heatedFloorReset: false,
    replacements: [],
  });
});

describe('useDraft', () => {
  it('stores the last saved calculation and persists it', () => {
    const lastSaved = {
      publicId: 'k3m9x2q7',
      versionNumber: 2,
      configurationHash: 'abc123',
    };

    useDraft.getState().setLastSaved(lastSaved);

    expect(useDraft.getState().lastSaved).toEqual(lastSaved);
    expect(useDraft.getState().revision).toBe(0);
    expect(stored().state.lastSaved).toEqual(lastSaved);
  });

  it('persists only the draft', () => {
    useDraft.getState().setStep('style');

    expect(stored()).toEqual({
      state: { ...createDefaultDraft(), step: 'style', furthestStep: 'style' },
      version: 2,
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

  it('clears leftover notices on reset', () => {
    useDraft.setState({
      notice: 'draftReset',
      heatedFloorReset: true,
      replacements: [
        {
          roomClientId: 'r',
          categoryId: 'c',
          fromProductId: 'a',
          toProductId: null,
        },
      ],
    });

    useDraft.getState().reset();

    expect(useDraft.getState()).toMatchObject({
      notice: null,
      heatedFloorReset: false,
      replacements: [],
    });
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

  it('opens a stored draft that still has gas and kitchen type', async () => {
    const room = {
      clientId: 'room-1',
      roomTypeCode: 'BEDROOM',
      name: null,
      lengthM: 4,
      widthM: 3,
      heightM: 2.7,
      heatedFloor: false,
      selections: {},
    };
    const legacy = createDefaultDraft();
    seed({
      ...legacy,
      step: 'style',
      furthestStep: 'style',
      styleId: 'modern',
      object: {
        ...legacy.object,
        finishLevel: 'ROUGH',
        totalAreaSqm: 60,
        gas: true,
        kitchenType: 'KITCHEN_LIVING',
      },
      rooms: [room],
    });

    await useDraft.persist.rehydrate();

    const { object, rooms, step, styleId, notice } = useDraft.getState();
    expect(notice).toBeNull();
    expect(step).toBe('style');
    expect(styleId).toBe('modern');
    expect(rooms).toEqual([room]);
    expect(object).toEqual({
      ...legacy.object,
      finishLevel: 'ROUGH',
      totalAreaSqm: 60,
    });
    expect(object).not.toHaveProperty('gas');
    expect(object).not.toHaveProperty('kitchenType');
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
    useDraft.getState().setObject({ totalAreaSqm: 60 });
    useDraft.getState().setObject({ finishLevel: 'ROUGH' });

    expect(useDraft.getState().object).toMatchObject({
      totalAreaSqm: 60,
      finishLevel: 'ROUGH',
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

  const heated = (id: string) =>
    useDraft.getState().rooms.find((room) => room.clientId === id)?.heatedFloor;

  it('turns the heated floor on and off for one room and bumps the revision', () => {
    const first = useDraft.getState().addRoom() as string;
    const second = useDraft.getState().addRoom() as string;
    const revision = useDraft.getState().revision;

    useDraft.getState().setHeatedFloor(first, true);

    expect([heated(first), heated(second)]).toEqual([true, false]);
    expect(useDraft.getState().revision).toBe(revision + 1);

    useDraft.getState().setHeatedFloor(first, false);
    useDraft.getState().setHeatedFloor(second, true);

    expect([heated(first), heated(second)]).toEqual([false, true]);
  });

  describe('toggleRoomOption', () => {
    it('adds and removes rooms and drops the option with the last room', () => {
      const first = useDraft.getState().addRoom() as string;
      const second = useDraft.getState().addRoom() as string;
      const revision = useDraft.getState().revision;

      useDraft.getState().toggleRoomOption('opt-soundproofing', first);
      useDraft.getState().toggleRoomOption('opt-soundproofing', second);

      expect(useDraft.getState().options['opt-soundproofing']).toEqual({
        roomClientIds: [first, second],
      });
      expect(useDraft.getState().revision).toBe(revision + 2);

      useDraft.getState().toggleRoomOption('opt-soundproofing', first);
      expect(useDraft.getState().options['opt-soundproofing']).toEqual({
        roomClientIds: [second],
      });

      useDraft.getState().toggleRoomOption('opt-soundproofing', second);
      expect(useDraft.getState().options).toEqual({});
    });

    it('leaves other options untouched', () => {
      const id = useDraft.getState().addRoom() as string;
      useDraft.setState({ options: { 'opt-ac': { quantity: 2 } } });

      useDraft.getState().toggleRoomOption('opt-soundproofing', id);

      expect(useDraft.getState().options).toEqual({
        'opt-ac': { quantity: 2 },
        'opt-soundproofing': { roomClientIds: [id] },
      });
    });
  });

  describe('toggleOption and setOptionQuantity', () => {
    beforeEach(() => {
      useDraft.setState({ ...createDefaultDraft(), revision: 0 });
    });

    it('turns a project option on and off', () => {
      useDraft.getState().toggleOption('opt-project', true);
      expect(useDraft.getState().options).toEqual({ 'opt-project': {} });
      expect(useDraft.getState().revision).toBe(1);

      useDraft.getState().toggleOption('opt-project', false);
      expect(useDraft.getState().options).toEqual({});
      expect(useDraft.getState().revision).toBe(2);
    });

    it('turns a piece option on with its initial quantity', () => {
      useDraft.getState().toggleOption('opt-piece', true, 3);
      expect(useDraft.getState().options).toEqual({
        'opt-piece': { quantity: 3 },
      });
    });

    it('sets and replaces the quantity, creating the entry when missing', () => {
      useDraft.getState().setOptionQuantity('opt-piece', 2);
      expect(useDraft.getState().options['opt-piece']).toEqual({ quantity: 2 });

      useDraft.getState().setOptionQuantity('opt-piece', 99);
      expect(useDraft.getState().options['opt-piece']).toEqual({
        quantity: 99,
      });
      expect(useDraft.getState().revision).toBe(2);
    });

    it('leaves other options untouched', () => {
      useDraft.setState({
        options: {
          'opt-room': { roomClientIds: ['a'] },
          'opt-piece': { quantity: 1 },
        },
      });

      useDraft.getState().toggleOption('opt-project', true);
      useDraft.getState().setOptionQuantity('opt-piece', 4);
      useDraft.getState().toggleOption('opt-project', false);

      expect(useDraft.getState().options).toEqual({
        'opt-room': { roomClientIds: ['a'] },
        'opt-piece': { quantity: 4 },
      });
    });
  });

  describe('heated floor on room type change', () => {
    const pricingOptions = makePricingData().options;

    const heatedRoom = () => {
      const id = useDraft.getState().addRoom() as string;
      useDraft.getState().updateRoom(id, { roomTypeCode: 'BATHROOM' });
      useDraft.getState().setHeatedFloor(id, true);
      return id;
    };

    it('turns the floor off and raises a notice when the new type is not allowed', () => {
      const id = heatedRoom();

      useDraft
        .getState()
        .updateRoom(id, { roomTypeCode: 'BEDROOM' }, undefined, pricingOptions);

      expect(heated(id)).toBe(false);
      expect(useDraft.getState().heatedFloorReset).toBe(true);
    });

    it('keeps the floor when the new type is allowed', () => {
      const id = heatedRoom();

      useDraft
        .getState()
        .updateRoom(id, { roomTypeCode: 'KITCHEN' }, undefined, pricingOptions);

      expect(heated(id)).toBe(true);
      expect(useDraft.getState().heatedFloorReset).toBe(false);
    });

    it('keeps the floor when the option is unknown or the type is untouched', () => {
      const id = heatedRoom();

      useDraft.getState().updateRoom(id, { roomTypeCode: 'BEDROOM' });
      expect(heated(id)).toBe(true);

      useDraft
        .getState()
        .updateRoom(id, { lengthM: 4 }, undefined, pricingOptions);
      expect(heated(id)).toBe(true);
      expect(useDraft.getState().heatedFloorReset).toBe(false);
    });

    it('clears the notice on reset, room removal and turning the floor on', () => {
      const raise = () => {
        const id = heatedRoom();
        useDraft
          .getState()
          .updateRoom(
            id,
            { roomTypeCode: 'BEDROOM' },
            undefined,
            pricingOptions,
          );
        expect(useDraft.getState().heatedFloorReset).toBe(true);
        return id;
      };

      useDraft.getState().reset();
      expect(useDraft.getState().heatedFloorReset).toBe(false);

      const removed = raise();
      useDraft.getState().removeRoom(removed);
      expect(useDraft.getState().heatedFloorReset).toBe(false);

      useDraft.getState().reset();
      const again = raise();
      useDraft.getState().setHeatedFloor(again, true);
      expect(useDraft.getState().heatedFloorReset).toBe(false);
    });

    it('dismisses the heated floor notice', () => {
      const id = heatedRoom();
      useDraft
        .getState()
        .updateRoom(id, { roomTypeCode: 'BEDROOM' }, undefined, pricingOptions);

      useDraft.getState().dismissHeatedFloorReset();

      expect(useDraft.getState().heatedFloorReset).toBe(false);
    });
  });

  describe('room options on room type change', () => {
    const pricingOptions = makePricingData().options;
    const acId = 'opt-ac';

    const roomWithAc = (type: 'BEDROOM' | 'BATHROOM') => {
      const id = useDraft.getState().addRoom() as string;
      useDraft.getState().updateRoom(id, { roomTypeCode: type });
      useDraft.getState().toggleRoomOption(acId, id);
      return id;
    };

    it('drops the room from an option the new type does not allow', () => {
      const first = roomWithAc('BEDROOM');
      const second = roomWithAc('BEDROOM');

      useDraft
        .getState()
        .updateRoom(
          first,
          { roomTypeCode: 'BATHROOM' },
          undefined,
          pricingOptions,
        );

      expect(useDraft.getState().options[acId]?.roomClientIds).toEqual([
        second,
      ]);
    });

    it('removes the option entry when no rooms are left', () => {
      const id = roomWithAc('BEDROOM');

      useDraft
        .getState()
        .updateRoom(
          id,
          { roomTypeCode: 'BATHROOM' },
          undefined,
          pricingOptions,
        );

      expect(useDraft.getState().options).toEqual({});
    });

    it('keeps the room when the new type is allowed', () => {
      const id = roomWithAc('BEDROOM');

      useDraft
        .getState()
        .updateRoom(id, { roomTypeCode: 'KITCHEN' }, undefined, pricingOptions);

      expect(useDraft.getState().options[acId]?.roomClientIds).toEqual([id]);
    });

    it('keeps options when no pricing options are given', () => {
      const id = roomWithAc('BEDROOM');

      useDraft.getState().updateRoom(id, { roomTypeCode: 'BATHROOM' });

      expect(useDraft.getState().options[acId]?.roomClientIds).toEqual([id]);
    });
  });
});

describe('useDraft reconcileCatalog', () => {
  const roomTypes = makeRoomTypes();
  const defaultMaterials = makeDefaultMaterials(styleIds.modern);
  const roomId = '00000000-0000-4000-8000-000000000301';

  const staleDraft = () => {
    const pricingData = makePricingData();
    useDraft.setState({
      ...createDefaultDraft(),
      styleId: styleIds.modern,
      rooms: [
        makeDraftRoom({
          clientId: roomId,
          selections: {
            [categoryIds.floor]: {
              productId: 'p-gone',
              disabled: false,
              source: 'manual',
            },
          },
        }),
      ],
    });
    return {
      pricingData,
      roomTypes,
      defaultMaterials,
      styleIds: [styleIds.modern],
    };
  };

  it('applies the reconciled draft, records replacements and bumps the revision', () => {
    const catalog = staleDraft();
    const revision = useDraft.getState().revision;

    useDraft.getState().reconcileCatalog(catalog);

    const state = useDraft.getState();
    expect(state.rooms[0]?.selections[categoryIds.floor]?.productId).not.toBe(
      'p-gone',
    );
    expect(state.replacements).toEqual([
      expect.objectContaining({
        roomClientId: roomId,
        categoryId: categoryIds.floor,
        fromProductId: 'p-gone',
      }),
    ]);
    expect(state.revision).toBe(revision + 1);
  });

  it('keeps the revision and replacements when nothing changes', () => {
    const catalog = staleDraft();
    useDraft.getState().reconcileCatalog(catalog);
    const revision = useDraft.getState().revision;

    useDraft.getState().reconcileCatalog(catalog);

    expect(useDraft.getState().revision).toBe(revision);
    expect(useDraft.getState().replacements).toHaveLength(1);
  });

  it('keeps the newest replacement for the same room and category', () => {
    const catalog = staleDraft();
    useDraft.setState({
      replacements: [
        {
          roomClientId: roomId,
          categoryId: categoryIds.floor,
          fromProductId: 'p-older',
          toProductId: null,
        },
        {
          roomClientId: roomId,
          categoryId: categoryIds.walls,
          fromProductId: 'p-other',
          toProductId: null,
        },
      ],
    });

    useDraft.getState().reconcileCatalog(catalog);

    const { replacements } = useDraft.getState();
    expect(replacements).toHaveLength(2);
    expect(
      replacements.find((item) => item.categoryId === categoryIds.floor)
        ?.fromProductId,
    ).toBe('p-gone');
  });

  it('clears replacements on dismiss and on reset', () => {
    useDraft.getState().reconcileCatalog(staleDraft());
    useDraft.getState().dismissReplacements();
    expect(useDraft.getState().replacements).toEqual([]);

    useDraft.getState().reconcileCatalog(staleDraft());
    useDraft.getState().reset();
    expect(useDraft.getState().replacements).toEqual([]);
  });

  it('does not persist replacements', () => {
    useDraft.getState().reconcileCatalog(staleDraft());

    expect(stored()?.state).not.toHaveProperty('replacements');
  });
});
