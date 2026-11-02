import type { Configuration, PricingData } from '@roomwise/calc-engine';
import { isOptionAllowedForRoom } from '@/lib/engine/room-options';

export function optionRoomIds(
  configuration: Configuration,
  pricing: PricingData,
): ReadonlyMap<string, readonly string[]> {
  const options = new Map(pricing.options.map((option) => [option.id, option]));
  const roomTypes = new Map(
    configuration.rooms.map((room) => [room.clientId, room.roomTypeCode]),
  );
  const result = new Map<string, readonly string[]>();
  for (const selection of configuration.options) {
    const option = options.get(selection.optionId);
    if (option === undefined || selection.roomClientIds === undefined) {
      continue;
    }
    result.set(
      selection.optionId,
      selection.roomClientIds.filter((id) => {
        const roomTypeCode = roomTypes.get(id);
        return (
          roomTypeCode !== undefined &&
          isOptionAllowedForRoom(option, roomTypeCode)
        );
      }),
    );
  }
  return result;
}
