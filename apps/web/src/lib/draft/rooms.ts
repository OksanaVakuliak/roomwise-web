import type { KitchenType, RoomTypeCode } from '@roomwise/calc-engine';
import { isRoomTypeAllowed } from '@/lib/engine/to-configuration';
import {
  type DraftOption,
  type DraftRoom,
  type DraftV1,
  MAX_ROOMS_STORED,
  ROOM_NAME_MAX,
} from './schema';

export function normalizeRoomName(text: string): string {
  return text.trim().slice(0, ROOM_NAME_MAX);
}

const ROOM_TYPE_ORDER: readonly RoomTypeCode[] = [
  'LIVING_ROOM',
  'BEDROOM',
  'KITCHEN',
  'KITCHEN_LIVING',
  'BATHROOM',
];

export function allowedRoomTypes(kitchenType: KitchenType): RoomTypeCode[] {
  return ROOM_TYPE_ORDER.filter((code) => isRoomTypeAllowed(kitchenType, code));
}

export function roomTypeMismatch(
  room: DraftRoom,
  kitchenType: KitchenType,
): boolean {
  return (
    room.roomTypeCode !== null &&
    !isRoomTypeAllowed(kitchenType, room.roomTypeCode)
  );
}

export function roomOrdinal(
  rooms: readonly DraftRoom[],
  clientId: string,
): number | null {
  const index = rooms.findIndex((room) => room.clientId === clientId);
  const room = rooms[index];
  if (!room) {
    return null;
  }
  return rooms
    .slice(0, index + 1)
    .filter((candidate) => candidate.roomTypeCode === room.roomTypeCode).length;
}

export function roomDisplayName(
  rooms: readonly DraftRoom[],
  room: DraftRoom,
  typeLabel: string,
): string {
  if (room.name !== null) {
    return room.name;
  }
  return `${typeLabel} ${roomOrdinal(rooms, room.clientId) ?? 1}`;
}

export function createRoom(
  draft: DraftV1,
  clientId: string = crypto.randomUUID(),
): DraftRoom {
  return {
    clientId,
    roomTypeCode: allowedRoomTypes(draft.object.kitchenType)[0] ?? null,
    name: null,
    lengthM: null,
    widthM: null,
    heightM: draft.rooms.at(-1)?.heightM ?? null,
    heatedFloor: false,
    selections: {},
  };
}

export function addRoom(draft: DraftV1, room: DraftRoom): DraftV1 {
  if (draft.rooms.length >= MAX_ROOMS_STORED) {
    return draft;
  }
  return { ...draft, rooms: [...draft.rooms, room] };
}

export function renameRoom(
  draft: DraftV1,
  clientId: string,
  name: string,
): DraftV1 {
  const trimmed = normalizeRoomName(name);
  return {
    ...draft,
    rooms: draft.rooms.map((room) =>
      room.clientId === clientId
        ? { ...room, name: trimmed === '' ? null : trimmed }
        : room,
    ),
  };
}

export function needsDeleteConfirm(draft: DraftV1, clientId: string): boolean {
  const room = draft.rooms.find((candidate) => candidate.clientId === clientId);
  if (!room) {
    return false;
  }
  const hasMaterial = Object.values(room.selections).some(
    (selection) => selection.productId !== null,
  );
  const inOption = Object.values(draft.options).some((option) =>
    option.roomClientIds?.includes(clientId),
  );
  return hasMaterial || room.heatedFloor || inOption;
}

export function removeRoom(draft: DraftV1, clientId: string): DraftV1 {
  const options: Record<string, DraftOption> = {};
  for (const [optionId, option] of Object.entries(draft.options)) {
    if (!option.roomClientIds) {
      options[optionId] = option;
      continue;
    }
    const roomClientIds = option.roomClientIds.filter((id) => id !== clientId);
    if (roomClientIds.length > 0) {
      options[optionId] = { ...option, roomClientIds };
    }
  }
  return {
    ...draft,
    rooms: draft.rooms.filter((room) => room.clientId !== clientId),
    options,
  };
}
