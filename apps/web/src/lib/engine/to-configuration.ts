import type {
  Configuration,
  Currency,
  KitchenType,
  OptionSelection,
  PricingData,
  Range,
  RoomConfiguration,
  RoomTypeCode,
} from '@roomwise/calc-engine';
import type { DraftRoom, DraftV1 } from '@/lib/draft/schema';

export type ConfigurationMode = 'preview' | 'strict';

export type ToConfigurationOptions = {
  mode: ConfigurationMode;
  currency: Currency;
  roomTypeCategories?: Partial<Record<RoomTypeCode, readonly string[]>>;
};

export type IncompleteReason =
  | 'FINISH_LEVEL'
  | 'TOTAL_AREA'
  | 'BALCONY_AREA'
  | 'ROOMS_COUNT'
  | 'ROOM_TYPE'
  | 'ROOM_TYPE_NOT_ALLOWED'
  | 'ROOM_DIMENSIONS'
  | 'STYLE';

export class IncompleteDraftError extends Error {
  readonly reason: IncompleteReason;
  readonly roomClientId: string | null;

  constructor(reason: IncompleteReason, roomClientId: string | null = null) {
    super(`Incomplete draft: ${reason}`);
    this.name = 'IncompleteDraftError';
    this.reason = reason;
    this.roomClientId = roomClientId;
  }
}

const ROOM_TYPES_BY_KITCHEN: Record<KitchenType, readonly RoomTypeCode[]> = {
  SEPARATE: ['LIVING_ROOM', 'BEDROOM', 'KITCHEN', 'BATHROOM'],
  KITCHEN_LIVING: ['BEDROOM', 'KITCHEN_LIVING', 'BATHROOM'],
};

export function isRoomTypeAllowed(
  kitchenType: KitchenType,
  roomTypeCode: RoomTypeCode,
): boolean {
  return ROOM_TYPES_BY_KITCHEN[kitchenType].includes(roomTypeCode);
}

function inRange(value: number | null, range: Range): value is number {
  return value !== null && value >= range.min && value <= range.max;
}

type CompleteRoom = DraftRoom & {
  roomTypeCode: RoomTypeCode;
  lengthM: number;
  widthM: number;
  heightM: number;
};

function roomProblem(
  room: DraftRoom,
  kitchenType: KitchenType,
  limits: PricingData['limits'],
): IncompleteReason | null {
  if (room.roomTypeCode === null) {
    return 'ROOM_TYPE';
  }
  if (!isRoomTypeAllowed(kitchenType, room.roomTypeCode)) {
    return 'ROOM_TYPE_NOT_ALLOWED';
  }
  const valid =
    inRange(room.lengthM, limits.roomSideM) &&
    inRange(room.widthM, limits.roomSideM) &&
    inRange(room.heightM, limits.roomHeightM);
  return valid ? null : 'ROOM_DIMENSIONS';
}

function selectionsOf(
  room: CompleteRoom,
  pricing: PricingData,
  options: ToConfigurationOptions,
): RoomConfiguration['selections'] {
  const typeCategories = options.roomTypeCategories?.[room.roomTypeCode];
  const categoryIds =
    typeCategories ??
    pricing.categories
      .map((category) => category.id)
      .filter((id) => id in room.selections);
  return categoryIds.map((categoryId) => {
    const selection = room.selections[categoryId];
    return {
      categoryId,
      productId: selection && !selection.disabled ? selection.productId : null,
    };
  });
}

function optionsOf(
  draft: DraftV1,
  pricing: PricingData,
  rooms: readonly RoomConfiguration[],
): OptionSelection[] {
  const roomIds = new Set(rooms.map((room) => room.clientId));
  const result: OptionSelection[] = [];
  for (const option of pricing.options) {
    const chosen = draft.options[option.id];
    if (!chosen) {
      continue;
    }
    switch (option.unit) {
      case 'PIECE':
        if (chosen.quantity !== undefined) {
          result.push({ optionId: option.id, quantity: chosen.quantity });
        }
        break;
      case 'PROJECT':
        result.push({ optionId: option.id });
        break;
      case 'ROOM':
      case 'ROOM_SQM': {
        const roomClientIds = (chosen.roomClientIds ?? []).filter((id) =>
          roomIds.has(id),
        );
        if (roomClientIds.length > 0) {
          result.push({ optionId: option.id, roomClientIds });
        }
        break;
      }
    }
  }
  return result;
}

export function toConfiguration(
  draft: DraftV1,
  pricing: PricingData,
  options: ToConfigurationOptions,
): Configuration | null {
  const strict = options.mode === 'strict';
  const { object } = draft;
  const { limits } = pricing;

  if (object.finishLevel === null) {
    if (strict) {
      throw new IncompleteDraftError('FINISH_LEVEL');
    }
    return null;
  }
  if (!inRange(object.totalAreaSqm, limits.totalAreaSqm)) {
    if (strict) {
      throw new IncompleteDraftError('TOTAL_AREA');
    }
    return null;
  }

  if (strict && object.balcony.present && object.balcony.areaSqm === null) {
    throw new IncompleteDraftError('BALCONY_AREA');
  }

  if (
    strict &&
    (draft.rooms.length < limits.rooms.min ||
      draft.rooms.length > limits.rooms.max)
  ) {
    throw new IncompleteDraftError('ROOMS_COUNT');
  }

  const rooms: RoomConfiguration[] = [];
  for (const room of draft.rooms) {
    const problem = roomProblem(room, object.kitchenType, limits);
    if (problem !== null) {
      if (strict) {
        throw new IncompleteDraftError(problem, room.clientId);
      }
      continue;
    }
    const complete = room as CompleteRoom;
    rooms.push({
      clientId: complete.clientId,
      roomTypeCode: complete.roomTypeCode,
      lengthM: complete.lengthM,
      widthM: complete.widthM,
      heightM: complete.heightM,
      heatedFloor: false,
      selections: selectionsOf(complete, pricing, options),
    });
  }

  if (strict && draft.styleId === null) {
    throw new IncompleteDraftError('STYLE');
  }

  return {
    finishLevel: object.finishLevel,
    totalAreaSqm: object.totalAreaSqm,
    balconyAreaSqm: object.balcony.present ? (object.balcony.areaSqm ?? 0) : 0,
    balconyTiles: object.balcony.present && object.balcony.tiles,
    gas: object.gas,
    kitchenType: object.kitchenType,
    rooms,
    options: optionsOf(draft, pricing, rooms),
    currency:
      options.currency === 'UAH' && pricing.exchangeRate !== null
        ? 'UAH'
        : 'USD',
  };
}
