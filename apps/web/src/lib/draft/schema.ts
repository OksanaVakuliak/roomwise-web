import { RoomTypeCodeSchema } from '@roomwise/calc-engine';
import { z } from 'zod';

export const MAX_ROOMS_STORED = 50;
export const ROOM_NAME_MAX = 60;

const id = z.string().min(1).max(64);
const amount = z.number().nonnegative();
const nullableAmount = amount.nullable();

export const StepIdSchema = z.enum([
  'object',
  'style',
  'interior',
  'engineering',
  'result',
]);

export const DraftSelectionSchema = z.object({
  productId: id.nullable(),
  disabled: z.boolean(),
  source: z.enum(['style', 'manual']),
});

export const DraftRoomSchema = z.object({
  clientId: id,
  roomTypeCode: RoomTypeCodeSchema.nullable(),
  name: z.string().max(60).nullable(),
  lengthM: nullableAmount,
  widthM: nullableAmount,
  heightM: nullableAmount,
  heatedFloor: z.boolean(),
  selections: z.record(id, DraftSelectionSchema),
});

export const DraftOptionSchema = z.object({
  quantity: amount.optional(),
  roomClientIds: z.array(id).max(MAX_ROOMS_STORED).optional(),
});

export const DraftObjectSchema = z.object({
  finishLevel: z.enum(['ROUGH', 'PRE_FINISH']).nullable(),
  totalAreaSqm: nullableAmount,
  gas: z.boolean(),
  kitchenType: z.enum(['SEPARATE', 'KITCHEN_LIVING']),
  balcony: z.object({
    present: z.boolean(),
    areaSqm: nullableAmount,
    tiles: z.boolean(),
  }),
});

export const DraftLastSavedSchema = z.object({
  publicId: id,
  versionNumber: z.number().int().nonnegative(),
  configurationHash: id,
});

export const DraftV1Schema = z.object({
  step: StepIdSchema,
  furthestStep: StepIdSchema,
  object: DraftObjectSchema,
  rooms: z.array(DraftRoomSchema).max(MAX_ROOMS_STORED),
  styleId: id.nullable(),
  options: z.record(id, DraftOptionSchema),
  lastSaved: DraftLastSavedSchema.nullable(),
});

export type StepId = z.infer<typeof StepIdSchema>;
export type DraftSelection = z.infer<typeof DraftSelectionSchema>;
export type DraftRoom = z.infer<typeof DraftRoomSchema>;
export type DraftOption = z.infer<typeof DraftOptionSchema>;
export type DraftV1 = z.infer<typeof DraftV1Schema>;

export function createDefaultDraft(): DraftV1 {
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
  };
}
