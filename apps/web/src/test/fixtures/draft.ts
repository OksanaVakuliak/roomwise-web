import type {
  DraftOption,
  DraftRoom,
  DraftSelection,
  DraftV1,
  StepId,
} from '@/lib/draft/schema';
import { categoryIds, productIds, styleIds } from './catalog';

export function makeDraftRoom(overrides: Partial<DraftRoom> = {}): DraftRoom {
  return {
    clientId: '00000000-0000-4000-8000-000000000301',
    roomTypeCode: 'LIVING_ROOM',
    name: null,
    lengthM: 5,
    widthM: 4,
    heightM: 2.7,
    heatedFloor: false,
    selections: {},
    ...overrides,
  };
}

export function makeEmptyDraft(overrides: Partial<DraftV1> = {}): DraftV1 {
  return {
    step: 'object',
    furthestStep: 'object',
    object: {
      finishLevel: null,
      totalAreaSqm: null,
      gas: false,
      kitchenType: 'SEPARATE',
      balcony: { present: false, areaSqm: null, tiles: false },
    },
    rooms: [],
    styleId: null,
    options: {},
    lastSaved: null,
    ...overrides,
  };
}

function styleSelection(productId: string | null): DraftSelection {
  return { productId, disabled: false, source: 'style' };
}

export function makeInteriorDraft(overrides: Partial<DraftV1> = {}): DraftV1 {
  return makeEmptyDraft({
    step: 'interior',
    furthestStep: 'interior',
    object: {
      finishLevel: 'PRE_FINISH',
      totalAreaSqm: 62,
      gas: false,
      kitchenType: 'SEPARATE',
      balcony: { present: true, areaSqm: 4, tiles: true },
    },
    rooms: [
      makeDraftRoom({
        clientId: '00000000-0000-4000-8000-000000000301',
        selections: {
          [categoryIds.floor]: styleSelection(productIds.laminate),
          [categoryIds.walls]: styleSelection(productIds.paint),
          [categoryIds.ceiling]: styleSelection(productIds.ceilingPaint),
        },
      }),
      makeDraftRoom({
        clientId: '00000000-0000-4000-8000-000000000302',
        roomTypeCode: 'BATHROOM',
        lengthM: 2,
        widthM: 2,
        heightM: 2.5,
        heatedFloor: true,
        selections: {
          [categoryIds.floor]: styleSelection(productIds.tile),
          [categoryIds.walls]: styleSelection(productIds.paint),
          [categoryIds.ceiling]: styleSelection(productIds.ceilingPaint),
        },
      }),
    ],
    styleId: styleIds.modern,
    ...overrides,
  });
}

export function makeFullRoomsDraft(overrides: Partial<DraftV1> = {}): DraftV1 {
  return makeInteriorDraft({
    object: {
      finishLevel: 'ROUGH',
      totalAreaSqm: 200,
      gas: true,
      kitchenType: 'SEPARATE',
      balcony: { present: false, areaSqm: null, tiles: false },
    },
    rooms: Array.from({ length: 15 }, (_, index) =>
      makeDraftRoom({
        clientId: `00000000-0000-4000-8000-${String(400 + index).padStart(12, '0')}`,
        roomTypeCode: index % 2 === 0 ? 'BEDROOM' : 'LIVING_ROOM',
        lengthM: 3,
        widthM: 3,
        heightM: 2.7,
        selections: {
          [categoryIds.floor]: styleSelection(productIds.laminate),
          [categoryIds.walls]: styleSelection(productIds.paint),
          [categoryIds.ceiling]: styleSelection(productIds.ceilingPaint),
        },
      }),
    ),
    ...overrides,
  });
}

export type { DraftOption, DraftRoom, DraftSelection, DraftV1, StepId };
