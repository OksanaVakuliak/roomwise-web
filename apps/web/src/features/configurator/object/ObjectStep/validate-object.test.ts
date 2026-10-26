import { describe, expect, it } from 'vitest';
import type { DraftRoom, DraftV1 } from '@/lib/draft/schema';
import { makeDraftRoom, makeEmptyDraft } from '@/test/fixtures/draft';
import { makePricingData } from '@/test/fixtures/pricing-data';
import { objectFieldDomId } from '../ObjectForm/field-ids';
import { roomFieldDomId } from '../RoomEditor/room-field';
import {
  isObjectValid,
  ROOMS_MESSAGE_DOM_ID,
  roomsExcess,
  validateObject,
} from './validate-object';

const { limits } = makePricingData();

const roomA = '00000000-0000-4000-8000-000000000a01';
const roomB = '00000000-0000-4000-8000-000000000a02';
const roomC = '00000000-0000-4000-8000-000000000a03';

function validRoom(overrides: Partial<DraftRoom> = {}): DraftRoom {
  return makeDraftRoom({
    clientId: roomA,
    roomTypeCode: 'BEDROOM',
    lengthM: limits.roomSideM.min,
    widthM: limits.roomSideM.min,
    heightM: limits.roomHeightM.min,
    ...overrides,
  });
}

function manyRooms(count: number): DraftRoom[] {
  return Array.from({ length: count }, (_, index) =>
    validRoom({
      clientId: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    }),
  );
}

function makeDraft(
  object: Partial<DraftV1['object']> = {},
  rooms: DraftRoom[] = [validRoom()],
): Pick<DraftV1, 'object' | 'rooms'> {
  const base = makeEmptyDraft();
  return {
    object: {
      ...base.object,
      finishLevel: 'ROUGH',
      totalAreaSqm: limits.totalAreaSqm.min,
      ...object,
    },
    rooms,
  };
}

function rangeOf(min: number, max: number, unit: 'm' | 'sqm' | 'pcs') {
  return { key: 'range', params: { min, max, unit } };
}

const balconyTotal = limits.totalAreaSqm.min + 10;

function withBalcony(areaSqm: number | null, totalAreaSqm: number | null) {
  return makeDraft({
    totalAreaSqm,
    balcony: { present: true, areaSqm, tiles: false },
  });
}

describe('validateObject', () => {
  describe('fully valid draft', () => {
    it('has no messages and no invalid id', () => {
      const result = validateObject(makeDraft(), limits);
      expect(result.object).toEqual({});
      expect(result.rooms).toEqual({});
      expect(result.roomsMessage).toBeNull();
      expect(result.firstInvalidId).toBeNull();
      expect(isObjectValid(result)).toBe(true);
    });
  });

  describe('finish level', () => {
    it('requires a finish level', () => {
      const result = validateObject(makeDraft({ finishLevel: null }), limits);
      expect(result.object.finishLevel).toEqual({ key: 'finishLevelRequired' });
      expect(isObjectValid(result)).toBe(false);
    });

    it('has no message when set', () => {
      const result = validateObject(
        makeDraft({ finishLevel: 'PRE_FINISH' }),
        limits,
      );
      expect(result.object.finishLevel).toBeUndefined();
    });
  });

  describe('total area', () => {
    const { min, max } = limits.totalAreaSqm;

    it.each([
      ['null', null],
      ['below min', min - 1],
      ['above max', max + 1],
    ])('reports a range message when %s', (_label, value) => {
      const result = validateObject(makeDraft({ totalAreaSqm: value }), limits);
      expect(result.object.totalArea).toEqual(rangeOf(min, max, 'sqm'));
      expect(isObjectValid(result)).toBe(false);
    });

    it.each([
      ['min', min],
      ['max', max],
    ])('is valid at %s', (_label, value) => {
      const result = validateObject(makeDraft({ totalAreaSqm: value }), limits);
      expect(result.object.totalArea).toBeUndefined();
    });
  });

  describe('balcony', () => {
    const absent = { present: false, areaSqm: null, tiles: false };

    it('has no message when absent even if area is null', () => {
      const result = validateObject(makeDraft({ balcony: absent }), limits);
      expect(result.object.balconyArea).toBeUndefined();
    });

    it('has no message when absent and total is null', () => {
      const result = validateObject(
        makeDraft({ balcony: absent, totalAreaSqm: null }),
        limits,
      );
      expect(result.object.balconyArea).toBeUndefined();
    });

    it.each([
      ['null', null],
      ['negative', -1],
      ['above the total', balconyTotal + 1],
    ])('reports a range up to the total when area is %s', (_label, area) => {
      const result = validateObject(withBalcony(area, balconyTotal), limits);
      expect(result.object.balconyArea).toEqual(
        rangeOf(0, balconyTotal, 'sqm'),
      );
    });

    it.each([
      ['zero', 0],
      ['the total', balconyTotal],
    ])('is valid at %s', (_label, area) => {
      const result = validateObject(withBalcony(area, balconyTotal), limits);
      expect(result.object.balconyArea).toBeUndefined();
    });

    it('falls back to the total area limit when total is null', () => {
      const result = validateObject(withBalcony(null, null), limits);
      expect(result.object.balconyArea).toEqual(
        rangeOf(0, limits.totalAreaSqm.max, 'sqm'),
      );
    });

    it('accepts an area up to the limit when total is null', () => {
      const result = validateObject(
        withBalcony(limits.totalAreaSqm.max, null),
        limits,
      );
      expect(result.object.balconyArea).toBeUndefined();
    });
  });

  describe('rooms count', () => {
    it('requires at least one room', () => {
      const result = validateObject(makeDraft({}, []), limits);
      expect(result.roomsMessage).toEqual({ key: 'roomsRequired' });
      expect(result.firstInvalidId).toBe('object-rooms-message');
      expect(result.firstInvalidId).toBe(ROOMS_MESSAGE_DOM_ID);
      expect(isObjectValid(result)).toBe(false);
    });

    it('rejects more rooms than the limit', () => {
      const result = validateObject(
        makeDraft({}, manyRooms(limits.rooms.max + 1)),
        limits,
      );
      expect(result.roomsMessage).toEqual(
        rangeOf(limits.rooms.min, limits.rooms.max, 'pcs'),
      );
      expect(result.firstInvalidId).toBe(ROOMS_MESSAGE_DOM_ID);
    });

    it('accepts the maximum number of rooms', () => {
      const result = validateObject(
        makeDraft({}, manyRooms(limits.rooms.max)),
        limits,
      );
      expect(result.roomsMessage).toBeNull();
      expect(isObjectValid(result)).toBe(true);
    });
  });

  describe('room fields', () => {
    const { min: sideMin, max: sideMax } = limits.roomSideM;
    const { min: heightMin, max: heightMax } = limits.roomHeightM;

    it('requires a room type', () => {
      const result = validateObject(
        makeDraft({}, [validRoom({ roomTypeCode: null })]),
        limits,
      );
      expect(result.rooms[roomA]?.roomTypeCode).toEqual({
        key: 'roomTypeRequired',
      });
      expect(result.firstInvalidId).toBe(roomFieldDomId(roomA, 'roomTypeCode'));
    });

    it.each([
      ['lengthM', null, sideMin, sideMax],
      ['lengthM', sideMin - 0.1, sideMin, sideMax],
      ['lengthM', sideMax + 0.1, sideMin, sideMax],
      ['widthM', null, sideMin, sideMax],
      ['widthM', sideMin - 0.1, sideMin, sideMax],
      ['widthM', sideMax + 0.1, sideMin, sideMax],
      ['heightM', null, heightMin, heightMax],
      ['heightM', heightMin - 0.1, heightMin, heightMax],
      ['heightM', heightMax + 0.1, heightMin, heightMax],
    ] as const)('%s = %s reports a meters range', (field, value, min, max) => {
      const result = validateObject(
        makeDraft({}, [validRoom({ [field]: value })]),
        limits,
      );
      expect(result.rooms[roomA]?.[field]).toEqual(rangeOf(min, max, 'm'));
      expect(result.firstInvalidId).toBe(roomFieldDomId(roomA, field));
      expect(isObjectValid(result)).toBe(false);
    });

    it.each([
      ['lengthM', sideMin],
      ['lengthM', sideMax],
      ['widthM', sideMin],
      ['widthM', sideMax],
      ['heightM', heightMin],
      ['heightM', heightMax],
    ] as const)('%s = %s is valid', (field, value) => {
      const result = validateObject(
        makeDraft({}, [validRoom({ [field]: value })]),
        limits,
      );
      expect(result.rooms[roomA]).toBeUndefined();
    });

    it('collects messages only for invalid rooms', () => {
      const result = validateObject(
        makeDraft({}, [
          validRoom(),
          validRoom({ clientId: roomB, lengthM: null }),
        ]),
        limits,
      );
      expect(Object.keys(result.rooms)).toEqual([roomB]);
    });
  });

  describe('kitchen type mismatch', () => {
    it('blocks without a field message', () => {
      const result = validateObject(
        makeDraft({ kitchenType: 'SEPARATE' }, [
          validRoom({ roomTypeCode: 'KITCHEN_LIVING' }),
        ]),
        limits,
      );
      expect(result.rooms[roomA]).toBeUndefined();
      expect(result.firstInvalidId).toBe(roomFieldDomId(roomA, 'roomTypeCode'));
      expect(isObjectValid(result)).toBe(false);
    });

    it('blocks the other way around', () => {
      const result = validateObject(
        makeDraft({ kitchenType: 'KITCHEN_LIVING' }, [
          validRoom({ roomTypeCode: 'LIVING_ROOM' }),
        ]),
        limits,
      );
      expect(result.rooms[roomA]).toBeUndefined();
      expect(result.firstInvalidId).toBe(roomFieldDomId(roomA, 'roomTypeCode'));
    });

    it('is valid with a matching room type', () => {
      const result = validateObject(
        makeDraft({ kitchenType: 'KITCHEN_LIVING' }, [
          validRoom({ roomTypeCode: 'KITCHEN_LIVING' }),
        ]),
        limits,
      );
      expect(isObjectValid(result)).toBe(true);
    });
  });

  describe('focus order', () => {
    const badBalcony = { present: true, areaSqm: -1, tiles: false };

    it('focuses finish level first', () => {
      const result = validateObject(
        makeDraft(
          { finishLevel: null, totalAreaSqm: null, balcony: badBalcony },
          [validRoom({ roomTypeCode: null })],
        ),
        limits,
      );
      expect(result.firstInvalidId).toBe(objectFieldDomId('finishLevel'));
    });

    it('focuses total area after finish level', () => {
      const result = validateObject(
        makeDraft({ totalAreaSqm: null, balcony: badBalcony }),
        limits,
      );
      expect(result.firstInvalidId).toBe(objectFieldDomId('totalArea'));
    });

    it('focuses the balcony area when it is the only invalid object field', () => {
      const result = validateObject(makeDraft({ balcony: badBalcony }), limits);
      expect(result.firstInvalidId).toBe(objectFieldDomId('balconyArea'));
    });

    it('focuses object fields before rooms', () => {
      const result = validateObject(
        makeDraft({ balcony: badBalcony }, [validRoom({ roomTypeCode: null })]),
        limits,
      );
      expect(result.firstInvalidId).toBe(objectFieldDomId('balconyArea'));
    });

    it('focuses the first invalid room in list order', () => {
      const result = validateObject(
        makeDraft({}, [
          validRoom(),
          validRoom({ clientId: roomB, widthM: null }),
          validRoom({ clientId: roomC, roomTypeCode: null }),
        ]),
        limits,
      );
      expect(result.firstInvalidId).toBe(roomFieldDomId(roomB, 'widthM'));
    });

    it('orders room fields as type, length, width, height', () => {
      const idFor = (overrides: Partial<DraftRoom>) =>
        validateObject(makeDraft({}, [validRoom(overrides)]), limits)
          .firstInvalidId;
      expect(
        idFor({
          roomTypeCode: null,
          lengthM: null,
          widthM: null,
          heightM: null,
        }),
      ).toBe(roomFieldDomId(roomA, 'roomTypeCode'));
      expect(idFor({ lengthM: null, widthM: null, heightM: null })).toBe(
        roomFieldDomId(roomA, 'lengthM'),
      );
      expect(idFor({ widthM: null, heightM: null })).toBe(
        roomFieldDomId(roomA, 'widthM'),
      );
      expect(idFor({ heightM: null })).toBe(roomFieldDomId(roomA, 'heightM'));
    });

    it('prefers room fields over the rooms-count message', () => {
      const rooms = manyRooms(limits.rooms.max + 1);
      const [first] = rooms;
      if (!first) {
        throw new Error('expected rooms');
      }
      first.lengthM = null;
      const result = validateObject(makeDraft({}, rooms), limits);
      expect(result.firstInvalidId).toBe(
        roomFieldDomId(first.clientId, 'lengthM'),
      );
    });
  });

  describe('excess area', () => {
    it('is null when total is null', () => {
      const result = validateObject(
        makeDraft({ totalAreaSqm: null }, [
          validRoom({ lengthM: 10, widthM: 10 }),
        ]),
        limits,
      );
      expect(result.excessAreaSqm).toBeNull();
    });

    it('is exposed on the validation result', () => {
      const result = validateObject(
        makeDraft({ totalAreaSqm: 30 }, [
          validRoom({ lengthM: 4, widthM: 3.5 }),
          validRoom({ clientId: roomB, lengthM: 5, widthM: 4 }),
        ]),
        limits,
      );
      expect(result.excessAreaSqm).toBe(4);
    });
  });
});

describe('roomsExcess', () => {
  it('is null when total is null', () => {
    expect(roomsExcess([validRoom({ lengthM: 10, widthM: 10 })], null)).toBe(
      null,
    );
  });

  it('is null when the sum is below the total', () => {
    expect(roomsExcess([validRoom({ lengthM: 3, widthM: 3 })], 30)).toBeNull();
  });

  it('is null when the sum equals the total', () => {
    expect(
      roomsExcess(
        [
          validRoom({ lengthM: 5, widthM: 4 }),
          validRoom({ clientId: roomB, lengthM: 5, widthM: 2 }),
        ],
        30,
      ),
    ).toBeNull();
  });

  it('returns the positive difference when the sum exceeds the total', () => {
    expect(
      roomsExcess(
        [
          validRoom({ roomTypeCode: 'BEDROOM', lengthM: 4, widthM: 3.5 }),
          validRoom({
            clientId: roomB,
            roomTypeCode: 'LIVING_ROOM',
            lengthM: 5,
            widthM: 4,
          }),
        ],
        30,
      ),
    ).toBe(4);
  });

  it('rounds the difference to two decimals', () => {
    expect(
      roomsExcess([validRoom({ lengthM: 3.333, widthM: 3.333 })], 10),
    ).toBe(1.11);
  });

  it('ignores rooms missing type, length or width', () => {
    expect(
      roomsExcess(
        [
          validRoom({ lengthM: 5, widthM: 4 }),
          validRoom({
            clientId: roomB,
            roomTypeCode: null,
            lengthM: 20,
            widthM: 20,
          }),
          validRoom({ clientId: roomC, lengthM: null, widthM: 20 }),
          validRoom({
            clientId: '00000000-0000-4000-8000-000000000a04',
            lengthM: 20,
            widthM: null,
          }),
        ],
        10,
      ),
    ).toBe(10);
  });

  it('counts a room with a null height', () => {
    expect(
      roomsExcess([validRoom({ lengthM: 5, widthM: 4, heightM: null })], 10),
    ).toBe(10);
  });
});
