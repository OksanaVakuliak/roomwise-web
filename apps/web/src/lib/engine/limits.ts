import {
  type Configuration,
  checkLimits,
  type LimitViolation,
  type PricingData,
} from '@roomwise/calc-engine';

export type LimitUnit = 'm' | 'sqm' | 'pcs';

export type RoomLimitField = 'lengthM' | 'widthM' | 'heightM';

export type LimitTarget =
  | { kind: 'object'; field: 'totalAreaSqm' | 'balconyAreaSqm' }
  | { kind: 'rooms' }
  | { kind: 'room'; roomClientId: string; field: RoomLimitField }
  | { kind: 'option'; optionId: string; field: 'quantity' }
  | { kind: 'unknown'; path: string };

export type FormLimitViolation = {
  target: LimitTarget;
  params: { min: number; max: number; unit: LimitUnit | null };
};

const ROOM_PATH = /^rooms\[(\d+)\]\.(lengthM|widthM|heightM)$/;
const OPTION_PATH = /^options\[(\d+)\]\.quantity$/;

function resolve(
  violation: LimitViolation,
  configuration: Configuration,
): { target: LimitTarget; unit: LimitUnit | null } {
  const { field } = violation;
  if (field === 'totalAreaSqm' || field === 'balconyAreaSqm') {
    return { target: { kind: 'object', field }, unit: 'sqm' };
  }
  if (field === 'rooms') {
    return { target: { kind: 'rooms' }, unit: 'pcs' };
  }
  const roomMatch = ROOM_PATH.exec(field);
  if (roomMatch) {
    const room = configuration.rooms[Number(roomMatch[1])];
    if (room) {
      return {
        target: {
          kind: 'room',
          roomClientId: room.clientId,
          field: roomMatch[2] as RoomLimitField,
        },
        unit: 'm',
      };
    }
  }
  const optionMatch = OPTION_PATH.exec(field);
  if (optionMatch) {
    const option = configuration.options[Number(optionMatch[1])];
    if (option) {
      return {
        target: {
          kind: 'option',
          optionId: option.optionId,
          field: 'quantity',
        },
        unit: 'pcs',
      };
    }
  }
  return { target: { kind: 'unknown', path: field }, unit: null };
}

export function mapLimitViolation(
  violation: LimitViolation,
  configuration: Configuration,
): FormLimitViolation {
  const { target, unit } = resolve(violation, configuration);
  return { target, params: { min: violation.min, max: violation.max, unit } };
}

export function findLimitViolations(
  configuration: Configuration,
  pricing: PricingData,
): LimitViolation[] {
  return checkLimits(configuration, pricing.limits, pricing.options);
}

export function toFormLimitViolations(
  violations: readonly LimitViolation[],
  configuration: Configuration,
): FormLimitViolation[] {
  return violations.map((violation) =>
    mapLimitViolation(violation, configuration),
  );
}
