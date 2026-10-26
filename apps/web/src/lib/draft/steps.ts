import type { PricingData, Range } from '@roomwise/calc-engine';
import { isRoomTypeAllowed } from '@/lib/engine/to-configuration';
import {
  type DraftRoom,
  type DraftV1,
  ROOM_NAME_MAX,
  type StepId,
} from './schema';

export const STEP_ORDER = [
  'object',
  'style',
  'interior',
  'engineering',
  'result',
] as const satisfies readonly StepId[];

export type StepState = 'now' | 'done' | 'later';

export type StepContext = {
  limits: PricingData['limits'];
  styleIds: readonly string[];
};

export function stepIndex(step: StepId): number {
  return STEP_ORDER.indexOf(step);
}

function inRange(value: number | null, range: Range): value is number {
  return value !== null && value >= range.min && value <= range.max;
}

function nameValid(name: string | null): boolean {
  if (name === null) {
    return true;
  }
  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed.length <= ROOM_NAME_MAX;
}

function roomComplete(
  room: DraftRoom,
  kitchenType: DraftV1['object']['kitchenType'],
  limits: PricingData['limits'],
): boolean {
  return (
    room.roomTypeCode !== null &&
    isRoomTypeAllowed(kitchenType, room.roomTypeCode) &&
    nameValid(room.name) &&
    inRange(room.lengthM, limits.roomSideM) &&
    inRange(room.widthM, limits.roomSideM) &&
    inRange(room.heightM, limits.roomHeightM)
  );
}

export function objectComplete(draft: DraftV1, context: StepContext): boolean {
  const { object, rooms } = draft;
  const { limits } = context;
  if (object.finishLevel === null) {
    return false;
  }
  if (!inRange(object.totalAreaSqm, limits.totalAreaSqm)) {
    return false;
  }
  const { balcony } = object;
  if (
    balcony.present &&
    !inRange(balcony.areaSqm, { min: 0, max: object.totalAreaSqm })
  ) {
    return false;
  }
  if (rooms.length < limits.rooms.min || rooms.length > limits.rooms.max) {
    return false;
  }
  return rooms.every((room) => roomComplete(room, object.kitchenType, limits));
}

export function styleComplete(draft: DraftV1, context: StepContext): boolean {
  return (
    objectComplete(draft, context) &&
    draft.styleId !== null &&
    context.styleIds.includes(draft.styleId)
  );
}

export function firstIncomplete(
  draft: DraftV1,
  context: StepContext,
): StepId | null {
  if (!objectComplete(draft, context)) {
    return 'object';
  }
  return styleComplete(draft, context) ? null : 'style';
}

export function isStepComplete(
  step: StepId,
  draft: DraftV1,
  context: StepContext,
): boolean {
  if (step === 'object') {
    return objectComplete(draft, context);
  }
  if (step === 'style') {
    return styleComplete(draft, context);
  }
  return true;
}

export function canOpen(
  step: StepId,
  draft: DraftV1,
  context: StepContext,
): boolean {
  const reachable = firstIncomplete(draft, context) ?? 'result';
  return (
    stepIndex(step) <= stepIndex(reachable) &&
    stepIndex(step) <= stepIndex(draft.furthestStep) + 1
  );
}

export function stepState(
  step: StepId,
  draft: DraftV1,
  context: StepContext,
): StepState {
  if (step === draft.step) {
    return 'now';
  }
  return stepIndex(step) < stepIndex(draft.furthestStep) &&
    isStepComplete(step, draft, context)
    ? 'done'
    : 'later';
}

export function nextStep(step: StepId): StepId | null {
  return STEP_ORDER[stepIndex(step) + 1] ?? null;
}
