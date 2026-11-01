import type { PricingData, RoomTypeCode } from '@roomwise/calc-engine';

type PricingOption = PricingData['options'][number];

export const HEATED_FLOOR_CODE = 'HEATED_FLOOR';

export function findHeatedFloorOption(
  options: readonly PricingOption[],
): PricingOption | undefined {
  return options.find((option) => option.code === HEATED_FLOOR_CODE);
}

export function isHeatedFloorAllowed(
  option: PricingOption | undefined,
  roomTypeCode: RoomTypeCode,
): boolean {
  if (!option) {
    return false;
  }
  return (
    option.roomTypeCodes.length === 0 ||
    option.roomTypeCodes.includes(roomTypeCode)
  );
}
