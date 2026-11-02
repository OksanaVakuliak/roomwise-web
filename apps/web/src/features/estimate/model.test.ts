import type { Estimate, EstimateLine } from '@roomwise/calc-engine';
import { beforeEach, describe, expect, it } from 'vitest';
import { clearEstimateCache, runEstimate } from '@/lib/engine/run-estimate';
import { makeDraftRoom, makeInteriorDraft } from '@/test/fixtures';
import { categoryIds, productIds } from '@/test/fixtures/catalog';
import type { DraftV1 } from '@/test/fixtures/draft';
import { makePricingData } from '@/test/fixtures/pricing-data';
import {
  buildEstimateModel,
  type EstimateCatalog,
  type EstimateLineModel,
  toEstimateRooms,
} from './model';

const pricing = makePricingData();
const livingId = '00000000-0000-4000-8000-000000000301';
const bathroomId = '00000000-0000-4000-8000-000000000302';

const catalog: EstimateCatalog = {
  product: (id) => ({ name: `Product ${id}`, brand: `Brand ${id}` }),
  category: (id) => `Category ${id}`,
  option: (id) => `Option ${id}`,
  packageItem: (id) => `Package ${id}`,
  rule: (id) => `Rule ${id}`,
};

function run(draft: DraftV1) {
  return runEstimate({
    draft,
    draftRevision: 1,
    pricing,
    pricingVersion: pricing.version,
    currency: 'UAH',
  });
}

function build(draft: DraftV1, blocked?: ReadonlySet<string>) {
  const { estimate, blockedLineIds } = run(draft);
  if (estimate === null) {
    throw new Error('estimate expected');
  }
  const model = buildEstimateModel({
    estimate,
    rooms: toEstimateRooms(draft.rooms, (code) => code),
    catalog,
    blockedLineIds: blocked ?? blockedLineIds,
  });
  return { estimate, model };
}

function sum(lines: readonly EstimateLineModel[]) {
  return {
    usdCents: lines.reduce((total, line) => total + (line.amountCents ?? 0), 0),
    uahKopecks: lines.reduce(
      (total, line) => total + (line.amountUahKopecks ?? 0),
      0,
    ),
  };
}

beforeEach(clearEstimateCache);

describe('buildEstimateModel', () => {
  it('matches engine section totals to the cent in USD and UAH', () => {
    const { estimate, model } = build(makeInteriorDraft());
    const { sections } = estimate.totals;
    expect(model.materials.subtotal).toEqual({
      usdCents: sections.MATERIALS.usdCents,
      uahKopecks: sections.MATERIALS.uahKopecks,
    });
    expect(model.engineering.subtotal).toEqual({
      usdCents: sections.ENGINEERING.usdCents,
      uahKopecks: sections.ENGINEERING.uahKopecks,
    });
    expect(model.additional.subtotal).toEqual({
      usdCents: sections.ADDITIONAL.usdCents,
      uahKopecks: sections.ADDITIONAL.uahKopecks,
    });
    expect(model.base.subtotal).toEqual({
      usdCents: sections.BASE.usdCents + sections.OBJECT.usdCents,
      uahKopecks:
        (sections.BASE.uahKopecks ?? 0) + (sections.OBJECT.uahKopecks ?? 0),
    });
    expect(model.materials.subtotal).toEqual(
      sum(model.materials.rooms.flatMap((room) => room.lines)),
    );
    for (const room of model.materials.rooms) {
      expect(room.subtotal).toEqual(sum(room.lines));
    }
  });

  it('keeps object lines apart from base lines inside the base section', () => {
    const { model } = build(makeInteriorDraft());
    expect(model.base.lines.every((line) => line.section === 'BASE')).toBe(
      true,
    );
    expect(model.base.lines.length).toBeGreaterThan(0);
    expect(model.base.objectLines.length).toBeGreaterThan(0);
    expect(
      model.base.objectLines.every((line) => line.section === 'OBJECT'),
    ).toBe(true);
    expect(model.base.objectLines[0]?.title).toMatch(/^Rule /);
  });

  it('orders rooms by the draft and names them', () => {
    const draft = makeInteriorDraft();
    const reversed = { ...draft, rooms: [...draft.rooms].reverse() };
    const { model } = build(reversed);
    expect(model.materials.rooms.map((room) => room.roomClientId)).toEqual([
      bathroomId,
      livingId,
    ]);
    expect(model.materials.rooms.map((room) => room.name)).toEqual([
      'BATHROOM 1',
      'LIVING_ROOM 1',
    ]);
  });

  it('resolves product, brand and category names', () => {
    const { model } = build(makeInteriorDraft());
    const line = model.materials.rooms[0]?.lines.find((item) => !item.disabled);
    expect(line?.title).toMatch(/^Product /);
    expect(line?.brand).toMatch(/^Brand /);
    expect(line?.category).toMatch(/^Category /);
  });

  it('marks a disabled category and adds a zero line for it', () => {
    const draft = makeInteriorDraft();
    const [living, ...rest] = draft.rooms;
    const disabled: DraftV1 = {
      ...draft,
      rooms: [
        {
          ...living,
          selections: {
            ...living.selections,
            [categoryIds.ceiling]: {
              productId: productIds.ceilingPaint,
              disabled: true,
              source: 'manual',
            },
          },
        },
        ...rest,
      ],
    };
    const { estimate, model } = build(disabled);
    const room = model.materials.rooms.find(
      (item) => item.roomClientId === livingId,
    );
    const line = room?.lines.find((item) => item.disabled);
    expect(line?.id).toBe(`MATERIALS:${livingId}:${categoryIds.ceiling}`);
    expect(line?.amountCents).toBe(0);
    expect(room?.lines.filter((item) => item.disabled)).toHaveLength(1);
    expect(model.materials.subtotal?.usdCents).toBe(
      estimate.totals.sections.MATERIALS.usdCents,
    );
  });

  it('attaches warnings to the line that carries them', () => {
    const draft = makeInteriorDraft();
    const { estimate } = build(draft);
    const target = estimate.lines.find((line) => line.section === 'MATERIALS');
    expect(target).toBeDefined();
    const patched: Estimate = {
      ...estimate,
      lines: estimate.lines.map(
        (line): EstimateLine =>
          line.id === target?.id
            ? { ...line, warnings: [{ code: 'HEATED_FLOOR_INCOMPATIBLE' }] }
            : line,
      ),
    };
    const model = buildEstimateModel({
      estimate: patched,
      rooms: toEstimateRooms(draft.rooms, (code) => code),
      catalog,
    });
    const flagged = model.materials.rooms
      .flatMap((room) => room.lines)
      .filter((line) => line.warnings.length > 0);
    expect(flagged.map((line) => line.id)).toEqual([target?.id]);
    expect(flagged[0]?.warnings[0]?.code).toBe('HEATED_FLOOR_INCOMPATIBLE');
  });

  it('nulls amounts and subtotals of blocked lines', () => {
    const { estimate } = build(makeInteriorDraft());
    const blocked = new Set(
      estimate.lines
        .filter((line) => line.roomClientId === livingId)
        .map((line) => line.id),
    );
    const { model } = build(makeInteriorDraft(), blocked);
    const living = model.materials.rooms.find(
      (room) => room.roomClientId === livingId,
    );
    expect(living?.subtotal).toBeNull();
    expect(living?.lines.every((line) => line.amountCents === null)).toBe(true);
    expect(model.materials.subtotal).toBeNull();
  });

  it('falls back to a null UAH subtotal when a line has no kopecks', () => {
    const draft = makeInteriorDraft({
      rooms: [makeDraftRoom({ clientId: livingId })],
    });
    const { estimate } = build(draft);
    const stripped: Estimate = {
      ...estimate,
      lines: estimate.lines.map(
        (line): EstimateLine => ({ ...line, amountUahKopecks: null }),
      ),
    };
    const model = buildEstimateModel({
      estimate: stripped,
      rooms: toEstimateRooms(draft.rooms, (code) => code),
      catalog,
    });
    expect(model.base.subtotal?.uahKopecks).toBeNull();
    expect(model.base.subtotal?.usdCents).toBeGreaterThan(0);
  });
});
