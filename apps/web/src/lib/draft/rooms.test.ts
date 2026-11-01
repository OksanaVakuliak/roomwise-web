import { describe, expect, it } from 'vitest';
import { makeDraftRoom, makeEmptyDraft } from '@/test/fixtures';
import {
  addRoom,
  createRoom,
  needsDeleteConfirm,
  removeRoom,
  renameRoom,
  roomDisplayName,
  roomMetrics,
  roomOrdinal,
} from './rooms';
import { MAX_ROOMS_STORED } from './schema';

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
  it('starts with the living room and no auto name', () => {
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

  it('starts with the living room type', () => {
    expect(createRoom(makeEmptyDraft(), 'new').roomTypeCode).toBe(
      'LIVING_ROOM',
    );
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

describe('roomMetrics', () => {
  it('computes floor area, perimeter and wall area without openings', () => {
    const metrics = roomMetrics(
      makeDraftRoom({
        roomTypeCode: 'BEDROOM',
        lengthM: 4,
        widthM: 3,
        heightM: 2.5,
      }),
    );

    expect(metrics?.floorArea).toBeCloseTo(12);
    expect(metrics?.perimeter).toBeCloseTo(14);
    expect(metrics?.wallArea).toBeCloseTo(35);
  });

  it('returns null while a dimension is missing', () => {
    expect(
      roomMetrics(makeDraftRoom({ lengthM: 4, widthM: null, heightM: 2.5 })),
    ).toBeNull();
  });
});
