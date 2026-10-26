import type { PricingData, Range } from '@roomwise/calc-engine';
import { roomVariables } from '@roomwise/calc-engine';
import type { DraftRoom, DraftV1 } from '@/lib/draft/schema';
import { isRoomTypeAllowed } from '@/lib/engine/to-configuration';
import { type ObjectFieldId, objectFieldDomId } from '../ObjectForm/field-ids';
import { type RoomFieldId, roomFieldDomId } from '../RoomEditor/room-field';

export const ROOMS_MESSAGE_DOM_ID = 'object-rooms-message';

export type FieldMessage =
  | { key: 'finishLevelRequired' }
  | { key: 'roomTypeRequired' }
  | { key: 'roomsRequired' }
  | {
      key: 'range';
      params: { min: number; max: number; unit: 'm' | 'sqm' | 'pcs' };
    };

export type RoomMessages = Partial<Record<RoomFieldId, FieldMessage>>;

export type ObjectValidation = {
  object: Partial<Record<ObjectFieldId, FieldMessage>>;
  rooms: Record<string, RoomMessages>;
  roomsMessage: FieldMessage | null;
  firstInvalidId: string | null;
  excessAreaSqm: number | null;
};

type Limits = PricingData['limits'];

function outOfRange(value: number | null, range: Range): boolean {
  return value === null || value < range.min || value > range.max;
}

function rangeMessage(
  value: number | null,
  range: Range,
  unit: 'm' | 'sqm' | 'pcs',
): FieldMessage | null {
  return outOfRange(value, range)
    ? { key: 'range', params: { min: range.min, max: range.max, unit } }
    : null;
}

function objectMessages(
  object: DraftV1['object'],
  limits: Limits,
): ObjectValidation['object'] {
  const messages: ObjectValidation['object'] = {};
  if (object.finishLevel === null) {
    messages.finishLevel = { key: 'finishLevelRequired' };
  }
  const total = rangeMessage(object.totalAreaSqm, limits.totalAreaSqm, 'sqm');
  if (total) {
    messages.totalArea = total;
  }
  if (object.balcony.present) {
    const balcony = rangeMessage(
      object.balcony.areaSqm,
      { min: 0, max: object.totalAreaSqm ?? limits.totalAreaSqm.max },
      'sqm',
    );
    if (balcony) {
      messages.balconyArea = balcony;
    }
  }
  return messages;
}

function roomMessages(room: DraftRoom, limits: Limits): RoomMessages {
  const messages: RoomMessages = {};
  if (room.roomTypeCode === null) {
    messages.roomTypeCode = { key: 'roomTypeRequired' };
  }
  const length = rangeMessage(room.lengthM, limits.roomSideM, 'm');
  if (length) {
    messages.lengthM = length;
  }
  const width = rangeMessage(room.widthM, limits.roomSideM, 'm');
  if (width) {
    messages.widthM = width;
  }
  const height = rangeMessage(room.heightM, limits.roomHeightM, 'm');
  if (height) {
    messages.heightM = height;
  }
  return messages;
}

const ROOM_FIELD_ORDER: readonly RoomFieldId[] = [
  'roomTypeCode',
  'name',
  'lengthM',
  'widthM',
  'heightM',
];

const OBJECT_FIELD_ORDER: readonly ObjectFieldId[] = [
  'finishLevel',
  'totalArea',
  'kitchenType',
  'balconyArea',
];

function roundArea(value: number): number {
  return Math.round(value * 100) / 100;
}

export function roomsExcess(
  rooms: readonly DraftRoom[],
  totalAreaSqm: number | null,
): number | null {
  if (totalAreaSqm === null) {
    return null;
  }
  let sum = 0;
  for (const room of rooms) {
    if (
      room.roomTypeCode !== null &&
      room.lengthM !== null &&
      room.widthM !== null
    ) {
      sum += roomVariables({
        roomTypeCode: room.roomTypeCode,
        lengthM: room.lengthM,
        widthM: room.widthM,
        heightM: room.heightM ?? 0,
        heatedFloor: room.heatedFloor,
      }).floorArea;
    }
  }
  const difference = roundArea(sum - totalAreaSqm);
  return difference > 0 ? difference : null;
}

export function validateObject(
  draft: Pick<DraftV1, 'object' | 'rooms'>,
  limits: Limits,
): ObjectValidation {
  const { object, rooms } = draft;
  const objectErrors = objectMessages(object, limits);
  const roomErrors: Record<string, RoomMessages> = {};
  let firstRoomId: string | null = null;

  for (const room of rooms) {
    const messages = roomMessages(room, limits);
    const mismatch =
      room.roomTypeCode !== null &&
      !isRoomTypeAllowed(object.kitchenType, room.roomTypeCode);
    if (Object.keys(messages).length > 0) {
      roomErrors[room.clientId] = messages;
    }
    if (firstRoomId === null) {
      const field = mismatch
        ? 'roomTypeCode'
        : ROOM_FIELD_ORDER.find((candidate) => messages[candidate]);
      if (field) {
        firstRoomId = roomFieldDomId(room.clientId, field);
      }
    }
  }

  const roomsMessage: FieldMessage | null =
    rooms.length === 0
      ? { key: 'roomsRequired' }
      : rangeMessage(rooms.length, limits.rooms, 'pcs');
  const firstObject = OBJECT_FIELD_ORDER.find(
    (candidate) => objectErrors[candidate],
  );

  return {
    object: objectErrors,
    rooms: roomErrors,
    roomsMessage,
    firstInvalidId: firstObject
      ? objectFieldDomId(firstObject)
      : (firstRoomId ?? (roomsMessage ? ROOMS_MESSAGE_DOM_ID : null)),
    excessAreaSqm: roomsExcess(rooms, object.totalAreaSqm),
  };
}

export function isObjectValid(validation: ObjectValidation): boolean {
  return validation.firstInvalidId === null;
}
