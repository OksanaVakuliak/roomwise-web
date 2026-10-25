import { describe, expect, it } from 'vitest';
import {
  makeDraftRoom,
  makeEmptyDraft,
  makeFullRoomsDraft,
  makeInteriorDraft,
} from '@/test/fixtures/draft';
import { migrate, salvage } from './migrate';
import { createDefaultDraft, DraftV1Schema } from './schema';

describe('DraftV1Schema', () => {
  it('accepts the fixture drafts', () => {
    for (const draft of [
      makeEmptyDraft(),
      makeInteriorDraft(),
      makeFullRoomsDraft(),
    ]) {
      expect(DraftV1Schema.parse(draft)).toEqual(draft);
    }
  });

  it('accepts the default draft', () => {
    expect(DraftV1Schema.parse(createDefaultDraft())).toEqual(
      createDefaultDraft(),
    );
  });

  it('rejects ids over 64 characters', () => {
    const draft = makeEmptyDraft({ styleId: 'x'.repeat(65) });
    expect(DraftV1Schema.safeParse(draft).success).toBe(false);
  });

  it('rejects negative numbers', () => {
    const draft = makeEmptyDraft({ rooms: [makeDraftRoom({ lengthM: -1 })] });
    expect(DraftV1Schema.safeParse(draft).success).toBe(false);
  });

  it('rejects more than 50 rooms', () => {
    const rooms = Array.from({ length: 51 }, (_, index) =>
      makeDraftRoom({ clientId: `room-${index}` }),
    );
    expect(DraftV1Schema.safeParse(makeEmptyDraft({ rooms })).success).toBe(
      false,
    );
  });
});

describe('migrate', () => {
  it('returns a valid v1 state unchanged', () => {
    const draft = makeInteriorDraft();
    expect(migrate(draft, 1)).toEqual({ draft });
  });

  it('resets the persisted envelope with a newer version', () => {
    const envelope = JSON.parse('{"state":{"rooms":"x"},"version":9}');
    expect(migrate(envelope.state, envelope.version)).toEqual({
      draft: createDefaultDraft(),
      notice: 'draftReset',
    });
  });

  it('resets non-object input', () => {
    expect(migrate(null, 1).notice).toBe('draftReset');
    expect(migrate('x', 1).notice).toBe('draftReset');
  });

  it('salvages valid fields and rooms from a broken draft', () => {
    const valid = makeDraftRoom();
    const source = makeInteriorDraft();
    const result = migrate(
      { ...source, step: 'nowhere', rooms: [valid, { clientId: 5 }] },
      1,
    );
    expect(result.notice).toBeUndefined();
    expect(result.draft.step).toBe('object');
    expect(result.draft.styleId).toBe(source.styleId);
    expect(result.draft.object).toEqual(source.object);
    expect(result.draft.rooms).toEqual([valid]);
  });

  it('salvages a newer-version draft when some fields still fit', () => {
    const result = migrate({ styleId: 'modern', extra: true }, 2);
    expect(result.notice).toBeUndefined();
    expect(result.draft.styleId).toBe('modern');
  });
});

describe('salvage', () => {
  it('returns null when nothing is recoverable', () => {
    expect(salvage({ rooms: 'x', step: 7 })).toBeNull();
    expect(salvage(undefined)).toBeNull();
  });
});
