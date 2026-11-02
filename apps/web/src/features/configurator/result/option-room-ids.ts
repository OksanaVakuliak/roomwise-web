import type { PricingData } from '@roomwise/calc-engine';
import type { DraftRoom, DraftV1 } from '@/lib/draft/schema';

function allowedRoomIds(
  option: PricingData['options'][number] | undefined,
  rooms: readonly DraftRoom[],
): string[] {
  return rooms
    .filter(
      (room) =>
        option === undefined ||
        option.roomTypeCodes.length === 0 ||
        (room.roomTypeCode !== null &&
          option.roomTypeCodes.includes(room.roomTypeCode)),
    )
    .map((room) => room.clientId);
}

export function optionRoomIds(
  draft: DraftV1,
  pricing: PricingData,
): ReadonlyMap<string, readonly string[]> {
  const options = new Map(pricing.options.map((option) => [option.id, option]));
  const result = new Map<string, readonly string[]>();
  for (const [optionId, choice] of Object.entries(draft.options)) {
    const ids = new Set(choice.roomClientIds);
    const rooms = draft.rooms.filter((room) => ids.has(room.clientId));
    if (rooms.length > 0) {
      result.set(optionId, allowedRoomIds(options.get(optionId), rooms));
    }
  }
  const heatedFloor = pricing.options.find(
    (option) => option.code === 'HEATED_FLOOR',
  );
  if (heatedFloor) {
    result.set(
      heatedFloor.id,
      allowedRoomIds(
        heatedFloor,
        draft.rooms.filter((room) => room.heatedFloor),
      ),
    );
  }
  return result;
}
