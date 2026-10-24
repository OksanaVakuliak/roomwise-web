import type { RoomTypeCode } from '@roomwise/calc-engine';
import { categoryIds, productIds, styleIds } from './catalog';

export type StepId = 'object' | 'style' | 'interior' | 'engineering' | 'result';

export type DraftSelection = {
  productId: string | null;
  disabled: boolean;
  source: 'style' | 'manual';
};

export type DraftRoom = {
  clientId: string;
  roomTypeCode: RoomTypeCode | null;
  name: string | null;
  lengthM: number | null;
  widthM: number | null;
  heightM: number | null;
  heatedFloor: boolean;
  selections: Record<string, DraftSelection>;
};

export type DraftOption = { quantity?: number; roomClientIds?: string[] };

export type DraftV1 = {
  step: StepId;
  furthestStep: StepId;
  object: {
    finishLevel: 'ROUGH' | 'PRE_FINISH' | null;
    totalAreaSqm: number | null;
    gas: boolean;
    kitchenType: 'SEPARATE' | 'KITCHEN_LIVING';
    balcony: { present: boolean; areaSqm: number | null; tiles: boolean };
  };
  rooms: DraftRoom[];
  styleId: string | null;
  options: Record<string, DraftOption>;
  lastSaved: {
    publicId: string;
    versionNumber: number;
    configurationHash: string;
  } | null;
};

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
