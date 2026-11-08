import { describe, expect, it } from 'vitest';
import {
  makeDraftRoom,
  makeEmptyDraft,
  makeFullRoomsDraft,
  makeInteriorDraft,
} from '@/test/fixtures/draft';
import { DRAFT_VERSION, migrate, salvage } from './migrate';
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
  it('returns a current state unchanged', () => {
    const draft = makeInteriorDraft();
    expect(migrate(draft, DRAFT_VERSION)).toEqual({ draft });
  });

  it('keeps the interior step reachable for a v1 draft past it', () => {
    const draft = makeEmptyDraft({
      step: 'engineering',
      furthestStep: 'engineering',
    });
    expect(migrate(draft, 1).draft).toEqual({
      ...draft,
      furthestStep: 'interior',
    });
  });

  it('leaves an earlier furthest step of a v1 draft as it is', () => {
    const draft = makeEmptyDraft({ step: 'style', furthestStep: 'style' });
    expect(migrate(draft, 1)).toEqual({ draft });
  });

  it('migrates a v1 draft to v3 as a full renovation keeping its state', () => {
    const draft = makeInteriorDraft();
    const { scope: _scope, ...object } = draft.object;
    const { styleAuto: _auto, ...v1 } = { ...draft, object };
    const result = migrate(v1, 1);
    expect(result.notice).toBeUndefined();
    expect(result.draft).toEqual({ ...draft, styleAuto: true });
    expect(result.draft.object.scope).toBe('FULL');
  });

  it('migrates a v2 draft to v3 as a full renovation keeping its state', () => {
    const draft = makeFullRoomsDraft();
    const { scope: _scope, ...object } = draft.object;
    const result = migrate({ ...draft, object }, 2);
    expect(result.notice).toBeUndefined();
    expect(result.draft).toEqual({ ...draft, styleAuto: true });
  });

  it('marks the style as automatic only when one was chosen', () => {
    const { scope: _scope, ...object } = makeEmptyDraft().object;
    const withoutStyle = migrate({ ...makeEmptyDraft(), object }, 2).draft;
    expect(withoutStyle.styleId).toBeNull();
    expect('styleAuto' in withoutStyle).toBe(false);
    const withStyle = migrate(
      { ...makeEmptyDraft({ styleId: 'modern' }), object },
      2,
    ).draft;
    expect(withStyle.styleAuto).toBe(true);
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
    const result = migrate({ styleId: 'modern', extra: true }, 3);
    expect(result.notice).toBeUndefined();
    expect(result.draft.styleId).toBe('modern');
  });
});

describe('salvage', () => {
  it('returns null when nothing is recoverable', () => {
    expect(salvage({ rooms: 'x', step: 7 })).toBeNull();
    expect(salvage(undefined)).toBeNull();
  });

  it('keeps the step within the furthest recovered step', () => {
    const draft = salvage({ step: 'result', furthestStep: 9 });
    expect(draft?.step).toBe('object');
    expect(draft?.furthestStep).toBe('object');
  });
});

describe('DraftV1Schema area share', () => {
  it('parses a draft saved before area shares existed', () => {
    const draft = makeInteriorDraft();
    const parsed = DraftV1Schema.parse(JSON.parse(JSON.stringify(draft)));
    for (const room of parsed.rooms) {
      for (const selection of Object.values(room.selections)) {
        expect(selection.areaShare).toBeUndefined();
      }
    }
    expect(parsed).toEqual(draft);
  });

  it('accepts shares from 1 to 100 and rejects others', () => {
    const withShare = (areaShare: number) =>
      DraftV1Schema.safeParse(
        makeInteriorDraft({
          rooms: [
            makeDraftRoom({
              selections: {
                a: {
                  productId: 'p',
                  disabled: false,
                  source: 'manual',
                  areaShare,
                },
              },
            }),
          ],
        }),
      ).success;
    expect(withShare(1)).toBe(true);
    expect(withShare(100)).toBe(true);
    expect(withShare(0)).toBe(false);
    expect(withShare(101)).toBe(false);
    expect(withShare(50.5)).toBe(false);
  });
});
