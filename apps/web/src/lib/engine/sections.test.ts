import { describe, expect, it } from 'vitest';
import { makeInteriorDraft, makePricingData } from '@/test/fixtures';
import { clearEstimateCache, runEstimate } from './run-estimate';
import { groupLines, OBJECT_GROUP_ID, toCostPanelView } from './sections';

const pricing = makePricingData();

function estimateOf() {
  clearEstimateCache();
  const draft = makeInteriorDraft();
  const { estimate } = runEstimate({
    draft,
    draftRevision: 1,
    pricing,
    pricingVersion: pricing.version,
    currency: 'USD',
  });
  if (estimate === null) {
    throw new Error('estimate expected');
  }
  return { estimate, draft };
}

describe('toCostPanelView', () => {
  it('takes base from the BASE section only', () => {
    const { estimate } = estimateOf();
    const { base } = toCostPanelView(estimate);
    expect(base?.usdCents).toBe(estimate.totals.sections.BASE.usdCents);
  });

  it('puts OBJECT into materials', () => {
    const { estimate } = estimateOf();
    const { sections } = estimate.totals;
    expect(sections.OBJECT.usdCents).toBeGreaterThan(0);
    expect(toCostPanelView(estimate).materials?.usdCents).toBe(
      sections.MATERIALS.usdCents + sections.OBJECT.usdCents,
    );
  });

  it('hides materials when they are not ready or OBJECT is blocked', () => {
    const { estimate } = estimateOf();
    expect(
      toCostPanelView(estimate, { materialsReady: false }).materials,
    ).toBeNull();
    expect(
      toCostPanelView(estimate, { blockedSections: new Set(['OBJECT']) })
        .materials,
    ).toBeNull();
    expect(
      toCostPanelView(estimate, { blockedSections: new Set(['OBJECT']) }).base,
    ).not.toBeNull();
  });
});

describe('groupLines', () => {
  it('keeps OBJECT lines out of base and groups them last in materials', () => {
    const { estimate, draft } = estimateOf();
    const grouped = groupLines(
      estimate,
      draft.rooms.map((room) => room.clientId),
    );
    expect(grouped.base.every((line) => line.section === 'BASE')).toBe(true);
    const last = grouped.materials.at(-1);
    expect(last?.roomClientId).toBe(OBJECT_GROUP_ID);
    expect(last?.lines.every((line) => line.section === 'OBJECT')).toBe(true);
  });

  it('leaves out an OBJECT group without amounts', () => {
    const { estimate, draft } = estimateOf();
    const zeroed = {
      ...estimate,
      lines: estimate.lines.map((line) =>
        line.section === 'OBJECT' && line.status === 'OK'
          ? { ...line, amountCents: 0, amountUahKopecks: 0 }
          : line,
      ),
    };
    const grouped = groupLines(
      zeroed,
      draft.rooms.map((room) => room.clientId),
    );
    expect(
      grouped.materials.some((group) => group.roomClientId === OBJECT_GROUP_ID),
    ).toBe(false);
  });
});
