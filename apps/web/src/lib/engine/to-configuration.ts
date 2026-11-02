import type {
  Configuration,
  Currency,
  OptionSelection,
  PricingData,
  Range,
  RoomConfiguration,
  RoomTypeCode,
} from '@roomwise/calc-engine';
import type { DraftRoom, DraftV1 } from '@/lib/draft/schema';
import { findHeatedFloorOption, isHeatedFloorAllowed } from './heated-floor';
import { isOptionAllowedForRoom } from './room-options';

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
  limits: PricingData['limits'],
): IncompleteReason | null {
  if (room.roomTypeCode === null) {
    return 'ROOM_TYPE';
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
  heatedFloorOption: PricingData['options'][number] | undefined,
): OptionSelection[] {
  const roomTypes = new Map(
    rooms.map((room) => [room.clientId, room.roomTypeCode]),
  );
  const result: OptionSelection[] = [];
  for (const option of pricing.options) {
    const chosen = draft.options[option.id];
    if (!chosen || option.id === heatedFloorOption?.id) {
      continue;
    }
    switch (option.unit) {
      case 'PIECE':
        result.push({
          optionId: option.id,
          quantity: chosen.quantity ?? option.minQuantity ?? 1,
        });
        break;
      case 'PROJECT':
        result.push({ optionId: option.id });
        break;
      case 'ROOM':
      case 'ROOM_SQM': {
        const roomClientIds = (chosen.roomClientIds ?? []).filter((id) => {
          const roomTypeCode = roomTypes.get(id);
          return (
            roomTypeCode !== undefined &&
            isOptionAllowedForRoom(option, roomTypeCode)
          );
        });
        if (roomClientIds.length > 0) {
          result.push({ optionId: option.id, roomClientIds });
        }
        break;
      }
    }
  }
  const heatedFloorRoomIds = rooms
    .filter((room) => room.heatedFloor)
    .map((room) => room.clientId);
  if (heatedFloorOption && heatedFloorRoomIds.length > 0) {
    result.push({
      optionId: heatedFloorOption.id,
      roomClientIds: heatedFloorRoomIds,
    });
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

  const heatedFloorOption = findHeatedFloorOption(pricing.options);
  const rooms: RoomConfiguration[] = [];
  for (const room of draft.rooms) {
    const problem = roomProblem(room, limits);
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
      heatedFloor:
        complete.heatedFloor &&
        isHeatedFloorAllowed(heatedFloorOption, complete.roomTypeCode),
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
    rooms,
    options: optionsOf(draft, pricing, rooms, heatedFloorOption),
    currency:
      options.currency === 'UAH' && pricing.exchangeRate !== null
        ? 'UAH'
        : 'USD',
  };
}
