import { beforeEach, describe, expect, it } from 'vitest';
import {
  makeDraftRoom,
  makeEmptyDraft,
  makeInteriorDraft,
  makePricingData,
} from '@/test/fixtures';
import type { DraftV1 } from '@/test/fixtures/draft';
import { clearEstimateCache, runEstimate } from './run-estimate';
import { groupLines } from './sections';

const pricing = makePricingData();

function run(
  draft: DraftV1,
  draftRevision = 1,
  currency: 'USD' | 'UAH' = 'USD',
) {
  return runEstimate({
    draft,
    draftRevision,
    pricing,
    pricingVersion: pricing.version,
    currency,
  });
}

beforeEach(clearEstimateCache);

describe('runEstimate', () => {
  it('computes the fixture draft estimate', () => {
    const result = run(makeInteriorDraft());
    expect(result.estimate).not.toBeNull();
    expect(result.violations).toEqual([]);
    expect(result.panel.base).not.toBeNull();
    expect(result.panel.materials).not.toBeNull();
    expect(result.panel.total?.usdCents).toBeGreaterThan(0);
  });

  it('returns the same reference for the same revision and version', () => {
    const draft = makeInteriorDraft();
    expect(run(draft, 3)).toBe(run(draft, 3));
  });

  it('computes anew when the revision or version changes', () => {
    const draft = makeInteriorDraft();
    const first = run(draft, 3);
    expect(run(draft, 4)).not.toBe(first);
    const other = runEstimate({
      draft,
      draftRevision: 3,
      pricing,
      pricingVersion: 'other',
      currency: 'USD',
    });
    expect(other).not.toBe(first);
  });

  it('has no estimate and an empty panel without area', () => {
    const result = run(makeEmptyDraft());
    expect(result.configuration).toBeNull();
    expect(result.estimate).toBeNull();
    expect(result.panel).toEqual({
      base: null,
      materials: null,
      engineering: null,
      additional: null,
      total: null,
    });
  });

  it('shows no materials before a style is chosen', () => {
    const result = run(makeInteriorDraft({ styleId: null }));
    expect(result.panel.materials).toBeNull();
    expect(result.panel.base).not.toBeNull();
  });

  it('total equals the sum of sections in both currencies', () => {
    const { estimate, panel } = run(
      makeInteriorDraft({
        options: { 'opt-ac': { quantity: 2 }, 'opt-design': {} },
      }),
    );
    const parts = [
      panel.base,
      panel.materials,
      panel.engineering,
      panel.additional,
    ];
    expect(panel.total?.usdCents).toBe(
      parts.reduce((sum, part) => sum + (part?.usdCents ?? 0), 0),
    );
    expect(panel.total?.uahKopecks).toBe(
      parts.reduce((sum, part) => sum + (part?.uahKopecks ?? 0), 0),
    );
    expect(panel.total?.usdCents).toBe(estimate?.totals.usdCents);
    expect(panel.total?.uahKopecks).toBe(estimate?.totals.uahKopecks);
  });

  it('nulls base lines and the total on an object-field violation', () => {
    const draft = makeInteriorDraft();
    const result = run({
      ...draft,
      object: {
        ...draft.object,
        balcony: { present: true, areaSqm: 500, tiles: true },
      },
    });
    expect(result.violations.map((violation) => violation.field)).toContain(
      'balconyAreaSqm',
    );
    expect(result.panel.base).toBeNull();
    expect(result.panel.total).toBeNull();
    expect(result.panel.materials).not.toBeNull();
    const grouped = groupLines(result.estimate!, [], result.blockedLineIds);
    expect(grouped.base.every((line) => line.amountCents === null)).toBe(true);
    expect(grouped.materials[0]?.lines[0]?.amountCents).not.toBeNull();
  });

  it('nulls option lines on an option violation', () => {
    const result = run(
      makeInteriorDraft({ options: { 'opt-ac': { quantity: 99 } } }),
    );
    expect(result.panel.engineering).toBeNull();
    expect(result.panel.total).toBeNull();
    expect(result.blockedLineIds).toEqual(
      new Set(['ENGINEERING:option:opt-ac']),
    );
  });
});

describe('groupLines', () => {
  it('groups materials by room in room order', () => {
    const draft = makeInteriorDraft();
    const { estimate } = run(draft);
    const order = draft.rooms.map((room) => room.clientId);
    const grouped = groupLines(estimate!, [...order].reverse());
    expect(grouped.materials.map((group) => group.roomClientId)).toEqual(
      [...order].reverse(),
    );
    expect(grouped.base.length).toBeGreaterThan(0);
    expect(grouped.engineering.length).toBeGreaterThan(0);
  });

  it('keeps rooms with no lines out', () => {
    const draft = makeInteriorDraft({ rooms: [makeDraftRoom()] });
    const { estimate } = run(draft);
    expect(groupLines(estimate!, ['absent']).materials).toEqual([]);
  });
});
