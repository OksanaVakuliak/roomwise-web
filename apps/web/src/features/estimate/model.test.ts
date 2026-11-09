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
  accessory: (key) => pricing.accessories?.[key]?.en,
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
      usdCents: sections.MATERIALS.usdCents + sections.OBJECT.usdCents,
      uahKopecks:
        (sections.MATERIALS.uahKopecks ?? 0) +
        (sections.OBJECT.uahKopecks ?? 0),
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
      usdCents: sections.BASE.usdCents,
      uahKopecks: sections.BASE.uahKopecks,
    });
    expect(model.materials.subtotal).toEqual(
      sum(
        [...model.materials.rooms, model.materials.balcony].flatMap(
          (room) => room?.lines ?? [],
        ),
      ),
    );
    for (const room of model.materials.rooms) {
      expect(room.subtotal).toEqual(sum(room.lines));
    }
  });

  it('keeps BASE lines in base and OBJECT lines in a materials balcony group', () => {
    const { model } = build(makeInteriorDraft());
    expect(model.base.lines.every((line) => line.section === 'BASE')).toBe(
      true,
    );
    expect(model.base.lines.length).toBeGreaterThan(0);
    const group = model.materials.balcony;
    expect(group?.roomClientId).toBe('OBJECT');
    expect(group?.lines.every((line) => line.section === 'OBJECT')).toBe(true);
    expect(group?.lines[0]?.title).toMatch(/^Rule /);
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
      estimate.totals.sections.MATERIALS.usdCents +
        estimate.totals.sections.OBJECT.usdCents,
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

  it('attaches unallocated share warnings to their room', () => {
    const draft = makeInteriorDraft();
    const { estimate } = build(draft);
    const patched: Estimate = {
      ...estimate,
      warnings: [
        {
          code: 'AREA_SHARE_UNALLOCATED',
          params: {
            roomClientId: livingId,
            surface: 'WALLS',
            percent: 30,
            sqm: 12.5,
          },
        },
        { code: 'ROOMS_AREA_MISMATCH' },
      ],
    };
    const model = buildEstimateModel({
      estimate: patched,
      rooms: toEstimateRooms(draft.rooms, (code) => code),
      catalog,
    });
    const [living, bathroom] = model.materials.rooms;

    expect(living?.warnings.map((warning) => warning.code)).toEqual([
      'AREA_SHARE_UNALLOCATED',
    ]);
    expect(bathroom?.warnings).toEqual([]);
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
        (line): EstimateLine => ({
          ...line,
          amountUahKopecks: null,
        }),
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

  describe('accessories', () => {
    function floorLines(model: ReturnType<typeof build>['model']) {
      return model.materials.rooms.flatMap((room) =>
        room.lines.filter((line) => line.categoryId === categoryIds.floor),
      );
    }

    it('lists accessory components by name in engine order', () => {
      const { model } = build(makeInteriorDraft());
      expect(floorLines(model).map((line) => line.accessories)).toEqual([
        [
          {
            key: 'laminate_underlay',
            name: 'Laminate underlay',
            amountCents: 4200,
          },
        ],
        [
          {
            key: 'tile_glue_heated',
            name: 'Heated floor tile glue',
            amountCents: 9240,
          },
        ],
      ]);
    });

    it('adds up with the product to the line amount to the cent', () => {
      const { estimate, model } = build(makeInteriorDraft());
      const components = new Map(
        estimate.lines.map((line) => [line.id, line.components ?? []]),
      );
      for (const line of floorLines(model)) {
        const material = (components.get(line.id) ?? [])
          .filter((component) => component.kind === 'MATERIAL')
          .reduce((total, component) => total + component.amountCents, 0);
        const accessories = line.accessories.reduce(
          (total, accessory) => total + accessory.amountCents,
          0,
        );
        expect(material + accessories).toBe(line.amountCents);
      }
    });

    it('skips an accessory whose name is unknown', () => {
      const { estimate } = run(makeInteriorDraft());
      const model = buildEstimateModel({
        estimate: estimate as Estimate,
        rooms: [],
        catalog: { ...catalog, accessory: () => undefined },
      });
      const lines = model.materials.rooms.flatMap((room) => room.lines);
      expect(lines.every((line) => line.accessories.length === 0)).toBe(true);
    });
  });
});
