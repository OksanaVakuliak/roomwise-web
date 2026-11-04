import { describe, expect, it } from 'vitest';
import { buildSaveRequest } from '@/features/configurator/result/build-save-request';
import type { VersionView } from '@/lib/api/calculations';
import { makeVersionView } from '@/test/fixtures/calculation';
import { categoryIds, productIds } from '@/test/fixtures/catalog';
import { makePricingData } from '@/test/fixtures/pricing-data';
import { fromVersion } from './from-version';
import { DraftV1Schema } from './schema';

const heatedFloorId = 'opt-heated-floor';

function versionWith(
  configuration: Partial<VersionView['configuration']> = {},
  overrides: Partial<VersionView> = {},
): VersionView {
  const base = makeVersionView();
  return {
    ...base,
    ...overrides,
    configuration: { ...base.configuration, ...configuration },
  };
}

const savedOptions = [
  { optionId: 'opt-ac', quantity: 3 },
  { optionId: 'opt-design' },
  { optionId: 'opt-smart-switches', roomClientIds: ['living', 'bath'] },
  { optionId: heatedFloorId, roomClientIds: ['bath'] },
];

describe('fromVersion', () => {
  it('maps the object, step and style', () => {
    const draft = fromVersion(makeVersionView(), heatedFloorId);

    expect(draft.object).toEqual({
      scope: 'FULL',
      finishLevel: 'PRE_FINISH',
      totalAreaSqm: 62,
      balcony: { present: true, areaSqm: 4, tiles: true },
    });
    expect(draft.step).toBe('result');
    expect(draft.furthestStep).toBe('result');
    expect(draft.styleId).toBe('style-modern');
  });

  it('sets styleId to null when the version has no style', () => {
    expect(
      fromVersion(makeVersionView({ style: null }), null).styleId,
    ).toBeNull();
  });

  it.each([
    [0, false, false, null],
    [0, true, true, 0],
    [3, false, true, 3],
    [3, true, true, 3],
  ])(
    'balcony area %s, tiles %s gives present %s',
    (balconyAreaSqm, balconyTiles, present, areaSqm) => {
      const draft = fromVersion(
        versionWith({ balconyAreaSqm, balconyTiles }),
        null,
      );

      expect(draft.object.balcony).toEqual({
        present,
        areaSqm,
        tiles: balconyTiles,
      });
    },
  );

  it('maps rooms with no name and manual selections', () => {
    const [living, bath] = fromVersion(makeVersionView(), heatedFloorId).rooms;

    expect(living).toEqual({
      clientId: 'living',
      roomTypeCode: 'LIVING_ROOM',
      name: null,
      lengthM: 5,
      widthM: 4,
      heightM: 2.7,
      heatedFloor: false,
      selections: {
        [categoryIds.floor]: {
          productId: productIds.laminate,
          disabled: false,
          source: 'manual',
        },
        [categoryIds.walls]: {
          productId: productIds.paint,
          disabled: false,
          source: 'manual',
        },
        [categoryIds.ceiling]: {
          productId: null,
          disabled: false,
          source: 'manual',
        },
      },
    });
    expect(bath?.heatedFloor).toBe(true);
    expect(Object.keys(bath?.selections ?? {})).toEqual([
      categoryIds.floor,
      categoryIds.ceiling,
    ]);
  });

  it('keeps a null product as not disabled', () => {
    const living = fromVersion(makeVersionView(), null).rooms[0];

    expect(living?.selections[categoryIds.ceiling]).toEqual({
      productId: null,
      disabled: false,
      source: 'manual',
    });
  });

  it('does not carry the heated floor option into options', () => {
    const draft = fromVersion(
      versionWith({ options: savedOptions }),
      heatedFloorId,
    );

    expect(draft.options).toEqual({
      'opt-ac': { quantity: 3 },
      'opt-design': {},
      'opt-smart-switches': { roomClientIds: ['living', 'bath'] },
    });
  });

  it('keeps every option when there is no heated floor option id', () => {
    const draft = fromVersion(versionWith({ options: savedOptions }), null);

    expect(draft.options[heatedFloorId]).toEqual({ roomClientIds: ['bath'] });
  });

  it('records the saved version', () => {
    const draft = fromVersion(makeVersionView(), heatedFloorId);

    expect(draft.lastSaved).toEqual({
      publicId: 'k3m9x2q7',
      versionNumber: 3,
      configurationHash: expect.any(String),
    });
  });

  it('produces a draft that passes the schema', () => {
    const draft = fromVersion(
      versionWith({ options: savedOptions }),
      heatedFloorId,
    );

    expect(DraftV1Schema.safeParse(draft).success).toBe(true);
    expect(
      DraftV1Schema.safeParse(
        fromVersion(
          versionWith(
            { balconyAreaSqm: 0, balconyTiles: false },
            { style: null },
          ),
          null,
        ),
      ).success,
    ).toBe(true);
  });

  it('produces the hash the save request computes for the same draft', () => {
    const pricing = makePricingData();
    const version = versionWith({ options: savedOptions });
    const draft = fromVersion(version, heatedFloorId);

    const request = buildSaveRequest(draft, pricing);

    expect(request).not.toBeNull();
    expect(request?.body.configuration).toEqual({
      ...version.configuration,
      scope: 'FULL',
    });
    expect(draft.lastSaved?.configurationHash).toBe(request?.hash);
  });

  it('matches the save request hash without balcony and options', () => {
    const pricing = makePricingData();
    const version = versionWith({
      balconyAreaSqm: 0,
      balconyTiles: false,
      options: [{ optionId: heatedFloorId, roomClientIds: ['bath'] }],
    });
    const draft = fromVersion(version, heatedFloorId);

    expect(draft.lastSaved?.configurationHash).toBe(
      buildSaveRequest(draft, pricing)?.hash,
    );
  });

  it('keeps a custom room name trimmed and within the limit', () => {
    const base = makeVersionView();
    const draft = fromVersion(
      versionWith({
        rooms: base.configuration.rooms.map((room, index) => ({
          ...room,
          name: index === 0 ? `  ${'a'.repeat(80)}  ` : '   ',
        })),
      }),
      null,
    );

    expect(draft.rooms[0]?.name).toBe('a'.repeat(60));
    expect(draft.rooms[1]?.name).toBeNull();
    expect(DraftV1Schema.safeParse(draft).success).toBe(true);
  });

  it('restores a custom room name and keeps it in the hash', () => {
    const base = makeVersionView();
    const named = versionWith({
      rooms: base.configuration.rooms.map((room) => ({
        ...room,
        name: 'Custom',
      })),
    });

    expect(fromVersion(named, null).rooms.map((room) => room.name)).toEqual([
      'Custom',
      'Custom',
    ]);
    expect(fromVersion(named, null).lastSaved?.configurationHash).not.toBe(
      fromVersion(base, null).lastSaved?.configurationHash,
    );
  });

  it('matches the save request hash for named rooms', () => {
    const pricing = makePricingData();
    const base = makeVersionView();
    const named = versionWith({
      balconyAreaSqm: 0,
      balconyTiles: false,
      options: [{ optionId: heatedFloorId, roomClientIds: ['bath'] }],
      rooms: base.configuration.rooms.map((room) => ({
        ...room,
        name: 'Custom',
      })),
    });
    const draft = fromVersion(named, heatedFloorId);

    expect(draft.lastSaved?.configurationHash).toBe(
      buildSaveRequest(draft, pricing)?.hash,
    );
  });
});
