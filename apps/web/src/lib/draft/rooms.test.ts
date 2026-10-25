import { describe, expect, it } from 'vitest';
import { makeDraftRoom, makeEmptyDraft } from '@/test/fixtures';
import {
  addRoom,
  allowedRoomTypes,
  createRoom,
  needsDeleteConfirm,
  removeRoom,
  renameRoom,
  roomDisplayName,
  roomOrdinal,
  roomTypeMismatch,
} from './rooms';
import { MAX_ROOMS_STORED } from './schema';

describe('allowedRoomTypes', () => {
  it('lists kitchen and living room for a separate kitchen', () => {
    expect(allowedRoomTypes('SEPARATE')).toEqual([
      'LIVING_ROOM',
      'BEDROOM',
      'KITCHEN',
      'BATHROOM',
    ]);
  });

  it('lists only the kitchen-living room for a combined kitchen', () => {
    expect(allowedRoomTypes('KITCHEN_LIVING')).toEqual([
      'BEDROOM',
      'KITCHEN_LIVING',
      'BATHROOM',
    ]);
  });
});

describe('roomTypeMismatch', () => {
  it('flags a type the kitchen type does not allow', () => {
    const kitchen = makeDraftRoom({ roomTypeCode: 'KITCHEN' });
    expect(roomTypeMismatch(kitchen, 'SEPARATE')).toBe(false);
    expect(roomTypeMismatch(kitchen, 'KITCHEN_LIVING')).toBe(true);
  });

  it('does not flag a room without a type', () => {
    expect(
      roomTypeMismatch(makeDraftRoom({ roomTypeCode: null }), 'SEPARATE'),
    ).toBe(false);
  });
});

describe('auto name', () => {
  const rooms = [
    makeDraftRoom({ clientId: 'a', roomTypeCode: 'BEDROOM' }),
    makeDraftRoom({ clientId: 'b', roomTypeCode: 'BATHROOM' }),
    makeDraftRoom({ clientId: 'c', roomTypeCode: 'BEDROOM' }),
    makeDraftRoom({ clientId: 'd', roomTypeCode: 'BEDROOM', name: 'Kids' }),
  ];

  it('numbers rooms within their own type', () => {
    expect(roomOrdinal(rooms, 'a')).toBe(1);
    expect(roomOrdinal(rooms, 'b')).toBe(1);
    expect(roomOrdinal(rooms, 'c')).toBe(2);
    expect(roomOrdinal(rooms, 'missing')).toBeNull();
  });

  it('builds the display name from the label and ordinal', () => {
    expect(roomDisplayName(rooms, makeDraftRoom(rooms[2]), 'Bedroom')).toBe(
      'Bedroom 2',
    );
  });

  it('prefers a custom name', () => {
    expect(roomDisplayName(rooms, makeDraftRoom(rooms[3]), 'Bedroom')).toBe(
      'Kids',
    );
  });
});

describe('createRoom and addRoom', () => {
  it('takes the first allowed type and no auto name', () => {
    expect(createRoom(makeEmptyDraft(), 'new')).toEqual({
      clientId: 'new',
      roomTypeCode: 'LIVING_ROOM',
      name: null,
      lengthM: null,
      widthM: null,
      heightM: null,
      heatedFloor: false,
      selections: {},
    });
  });

  it('follows the kitchen type for the first type', () => {
    const draft = makeEmptyDraft({
      object: { ...makeEmptyDraft().object, kitchenType: 'KITCHEN_LIVING' },
    });
    expect(createRoom(draft, 'new').roomTypeCode).toBe('BEDROOM');
  });

  it('takes the height from the previous room', () => {
    const draft = makeEmptyDraft({
      rooms: [
        makeDraftRoom({ clientId: 'a', heightM: 2.5 }),
        makeDraftRoom({ clientId: 'b', heightM: 3 }),
      ],
    });
    expect(createRoom(draft, 'c').heightM).toBe(3);
  });

  it('generates a client id when none is given', () => {
    expect(createRoom(makeEmptyDraft()).clientId).not.toBe('');
  });

  it('appends without mutating', () => {
    const draft = makeEmptyDraft();
    const next = addRoom(draft, createRoom(draft, 'new'));
    expect(next.rooms).toHaveLength(1);
    expect(draft.rooms).toHaveLength(0);
  });

  it('stops at the stored rooms limit', () => {
    const rooms = Array.from({ length: MAX_ROOMS_STORED }, (_, index) =>
      makeDraftRoom({ clientId: `r${index}` }),
    );
    const draft = makeEmptyDraft({ rooms });
    expect(addRoom(draft, createRoom(draft, 'extra'))).toBe(draft);
  });
});

describe('renameRoom', () => {
  const draft = makeEmptyDraft({ rooms: [makeDraftRoom({ clientId: 'a' })] });

  it('trims the name and cuts it to the limit', () => {
    expect(renameRoom(draft, 'a', '  Hall  ').rooms[0]?.name).toBe('Hall');
    expect(renameRoom(draft, 'a', 'x'.repeat(80)).rooms[0]?.name).toHaveLength(
      60,
    );
  });

  it('restores the auto name for a blank value', () => {
    const named = renameRoom(draft, 'a', 'Hall');
    expect(renameRoom(named, 'a', '   ').rooms[0]?.name).toBeNull();
  });
});

describe('removeRoom', () => {
  const draft = makeEmptyDraft({
    rooms: [makeDraftRoom({ clientId: 'a' }), makeDraftRoom({ clientId: 'b' })],
    options: {
      shared: { roomClientIds: ['a', 'b'] },
      onlyA: { roomClientIds: ['a'] },
      flat: { quantity: 2 },
    },
  });

  it('removes the room and cleans options', () => {
    const next = removeRoom(draft, 'a');
    expect(next.rooms.map((room) => room.clientId)).toEqual(['b']);
    expect(next.options).toEqual({
      shared: { roomClientIds: ['b'] },
      flat: { quantity: 2 },
    });
  });

  it('does not mutate the source draft', () => {
    removeRoom(draft, 'a');
    expect(draft.rooms).toHaveLength(2);
    expect(draft.options.onlyA).toEqual({ roomClientIds: ['a'] });
  });
});

describe('needsDeleteConfirm', () => {
  it('is false for an untouched room', () => {
    const draft = makeEmptyDraft({
      rooms: [
        makeDraftRoom({
          clientId: 'a',
          selections: {
            c: { productId: null, disabled: false, source: 'style' },
          },
        }),
      ],
    });
    expect(needsDeleteConfirm(draft, 'a')).toBe(false);
    expect(needsDeleteConfirm(draft, 'missing')).toBe(false);
  });

  it('is true with a chosen product', () => {
    const draft = makeEmptyDraft({
      rooms: [
        makeDraftRoom({
          clientId: 'a',
          selections: {
            c: { productId: 'p', disabled: false, source: 'manual' },
          },
        }),
      ],
    });
    expect(needsDeleteConfirm(draft, 'a')).toBe(true);
  });

  it('is true with a heated floor', () => {
    const draft = makeEmptyDraft({
      rooms: [makeDraftRoom({ clientId: 'a', heatedFloor: true })],
    });
    expect(needsDeleteConfirm(draft, 'a')).toBe(true);
  });

  it('is true when an option covers the room', () => {
    const draft = makeEmptyDraft({
      rooms: [makeDraftRoom({ clientId: 'a' })],
      options: { o: { roomClientIds: ['a'] } },
    });
    expect(needsDeleteConfirm(draft, 'a')).toBe(true);
  });
});
