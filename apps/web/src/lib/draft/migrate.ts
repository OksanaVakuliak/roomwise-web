import {
  createDefaultDraft,
  DraftRoomSchema,
  type DraftV1,
  DraftV1Schema,
  MAX_ROOMS_STORED,
  StepIdSchema,
} from './schema';

export const DRAFT_VERSION = 1;

export type DraftMigration = {
  draft: DraftV1;
  notice?: 'draftReset';
};

const transitions: Record<number, (state: unknown) => unknown> = {};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function salvage(state: unknown): DraftV1 | null {
  if (!isRecord(state)) {
    return null;
  }
  const fields = DraftV1Schema.shape;
  const draft = createDefaultDraft();
  const target: Record<string, unknown> = draft;
  let recovered = 0;
  for (const key of Object.keys(fields) as (keyof typeof fields)[]) {
    if (key === 'rooms' || !(key in state)) {
      continue;
    }
    const result = fields[key].safeParse(state[key]);
    if (result.success) {
      target[key] = result.data;
      recovered += 1;
    }
  }
  if (Array.isArray(state.rooms)) {
    draft.rooms = state.rooms.slice(0, MAX_ROOMS_STORED).flatMap((room) => {
      const result = DraftRoomSchema.safeParse(room);
      return result.success ? [result.data] : [];
    });
    recovered += draft.rooms.length;
  }
  const order = StepIdSchema.options;
  if (order.indexOf(draft.step) > order.indexOf(draft.furthestStep)) {
    draft.step = draft.furthestStep;
  }
  return recovered > 0 ? draft : null;
}

function recover(state: unknown): DraftMigration {
  const draft = salvage(state);
  return draft
    ? { draft }
    : { draft: createDefaultDraft(), notice: 'draftReset' };
}

export function migrate(state: unknown, fromVersion: number): DraftMigration {
  if (fromVersion > DRAFT_VERSION) {
    return recover(state);
  }
  let current = state;
  try {
    for (let version = fromVersion; version < DRAFT_VERSION; version += 1) {
      const step = transitions[version];
      if (!step) {
        return recover(state);
      }
      current = step(current);
    }
  } catch {
    return recover(state);
  }
  const parsed = DraftV1Schema.safeParse(current);
  return parsed.success ? { draft: parsed.data } : recover(state);
}
