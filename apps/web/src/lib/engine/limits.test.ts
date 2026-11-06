import type { Configuration } from '@roomwise/calc-engine';
import { describe, expect, it } from 'vitest';
import { makeInteriorDraft, makePricingData } from '@/test/fixtures';
import {
  findLimitViolations,
  mapLimitViolation,
  toFormLimitViolations,
} from './limits';
import { toConfiguration } from './to-configuration';

const pricing = makePricingData();
const draft = makeInteriorDraft({
  options: { 'opt-ac': { quantity: 2 } },
});
const base = toConfiguration(draft, pricing, {
  mode: 'preview',
  currency: 'USD',
}) as Configuration;

describe('mapLimitViolation', () => {
  const range = { min: 1, max: 9 };

  it('maps object fields', () => {
    expect(
      mapLimitViolation({ field: 'totalAreaSqm', ...range }, base),
    ).toEqual({
      target: { kind: 'object', field: 'totalAreaSqm' },
      params: { ...range, unit: 'sqm' },
    });
    expect(
      mapLimitViolation({ field: 'balconyAreaSqm', ...range }, base).target,
    ).toEqual({
      kind: 'object',
      field: 'balconyAreaSqm',
    });
  });

  it.each(['lengthM', 'widthM', 'heightM'])(
    'maps room %s by index',
    (field) => {
      const secondRoom = base.rooms[1];
      expect(
        mapLimitViolation({ field: `rooms[1].${field}`, ...range }, base),
      ).toEqual({
        target: { kind: 'room', roomClientId: secondRoom?.clientId, field },
        params: { ...range, unit: 'm' },
      });
    },
  );

  it('maps option quantity by index', () => {
    expect(
      mapLimitViolation({ field: 'options[0].quantity', ...range }, base),
    ).toEqual({
      target: { kind: 'option', optionId: 'opt-ac', field: 'quantity' },
      params: { ...range, unit: 'pcs' },
    });
  });

  it('maps the rooms count', () => {
    expect(mapLimitViolation({ field: 'rooms', ...range }, base)).toEqual({
      target: { kind: 'rooms' },
      params: { ...range, unit: 'pcs' },
    });
  });

  it.each(['nonsense', 'rooms[9].lengthM', 'options[5].quantity'])(
    'falls back for %s',
    (field) => {
      expect(mapLimitViolation({ field, ...range }, base)).toEqual({
        target: { kind: 'unknown', path: field },
        params: { ...range, unit: null },
      });
    },
  );
});

describe('findLimitViolations', () => {
  it('returns none for a valid configuration', () => {
    expect(findLimitViolations(base, pricing)).toEqual([]);
  });

  it('reports real engine violations and maps them to the form', () => {
    const broken: Configuration = {
      ...base,
      balconyAreaSqm: 500,
      rooms: base.rooms.map((room, index) =>
        index === 1 ? { ...room, heightM: 9 } : room,
      ),
      options: [{ optionId: 'opt-ac', quantity: 99 }],
    };
    const violations = findLimitViolations(broken, pricing);
    expect(violations.map((violation) => violation.field).sort()).toEqual([
      'balconyAreaSqm',
      'options[0].quantity',
      'rooms[1].heightM',
    ]);
    const targets = toFormLimitViolations(violations, broken).map(
      (violation) => violation.target.kind,
    );
    expect(targets.sort()).toEqual(['object', 'option', 'room']);
  });
});
