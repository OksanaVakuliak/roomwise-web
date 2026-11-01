import type {
  EstimateLine,
  PricingData,
  RoomTypeCode,
} from '@roomwise/calc-engine';
import { HEATED_FLOOR_CODE, isOptionAllowedForRoom } from './room-options';

type PricingOption = PricingData['options'][number];

export { HEATED_FLOOR_CODE };

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
  return isOptionAllowedForRoom(option, roomTypeCode);
}

export const HEATED_FLOOR_INCOMPATIBLE_CODE = 'HEATED_FLOOR_INCOMPATIBLE';

export function hasHeatedFloorWarning(
  line: Pick<EstimateLine, 'warnings'> | null | undefined,
): boolean {
  return (
    line?.warnings.some(
      (warning) => warning.code === HEATED_FLOOR_INCOMPATIBLE_CODE,
    ) ?? false
  );
}
