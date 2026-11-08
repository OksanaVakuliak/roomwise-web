import { describe, expect, it } from 'vitest';
import { calculationIds, makeVersionView } from '@/test/fixtures';
import { snapshotRooms, toSnapshotModel } from './snapshot-model';
import { isPublicId, parseVersionNumber } from './version-number';

describe('toSnapshotModel', () => {
  it('takes every name and sum from the snapshot lines', () => {
    const model = toSnapshotModel(makeVersionView());
    const [living, bathroom] = model.materials.rooms;

    expect(living?.name).toBe('Living room 1');
    expect(bathroom?.name).toBe('Bathroom 1');
    expect(living?.lines.map((line) => line.title)).toEqual([
      'Oak Natural Laminate',
      'Silk White Wall Paint',
    ]);
    expect(living?.lines[0]).toMatchObject({
      brand: 'Roomwise',
      category: 'Flooring',
      amountCents: 42000,
      amountUahKopecks: 1871029,
    });
    expect(model.materials.balcony?.lines[0]?.title).toBe('Balcony tiles');
    expect(model.engineering.lines.map((line) => line.title)).toEqual([
      'Electrical wiring',
      'Air conditioner',
    ]);
    expect(model.additional.lines[0]?.title).toBe('Design project');
  });

  it('carries the unallocated share warnings of the snapshot into the room', () => {
    const base = makeVersionView();
    const roomClientId = base.rooms[0]?.clientId ?? '';
    const model = toSnapshotModel(
      makeVersionView({
        warnings: [
          {
            code: 'AREA_SHARE_UNALLOCATED',
            params: { roomClientId, surface: 'FLOOR', percent: 20, sqm: 4 },
          },
        ],
      }),
    );

    expect(model.materials.rooms[0]?.warnings).toHaveLength(1);
    expect(model.materials.rooms[1]?.warnings).toEqual([]);
  });

  it('numbers rooms of the same type and keeps custom names', () => {
    const base = makeVersionView();
    const [living] = base.rooms;
    if (!living) {
      throw new Error('room expected');
    }
    const livingConfig = base.configuration.rooms[0];
    if (!livingConfig) {
      throw new Error('room expected');
    }
    const version = makeVersionView({
      rooms: [
        living,
        { ...living, clientId: 'second' },
        { ...living, clientId: 'third' },
      ],
      configuration: {
        ...base.configuration,
        rooms: [{ ...livingConfig, clientId: 'third', name: 'Hall' }],
      },
    });

    expect(snapshotRooms(version).map((room) => room.name)).toEqual([
      'Living room 1',
      'Living room 2',
      'Hall',
    ]);
  });

  it('never marks a category as disabled', () => {
    const model = toSnapshotModel(makeVersionView());
    const lines = [
      ...model.materials.rooms.flatMap((room) => room.lines),
      ...model.engineering.lines,
    ];

    expect(lines.some((line) => line.disabled)).toBe(false);
  });

  it('marks lines that are no longer available and keeps their amount', () => {
    const lineId = `MATERIALS:${calculationIds.livingRoom}:cat-floor`;
    const version = makeVersionView();
    const priceStatus = version.priceStatus;
    if (!priceStatus) {
      throw new Error('price status expected');
    }
    const model = toSnapshotModel({
      ...version,
      priceStatus: {
        ...priceStatus,
        unavailableItems: [{ lineId, productId: null, optionId: null }],
      },
    });
    const marked = model.materials.rooms
      .flatMap((room) => room.lines)
      .filter((line) => line.errorCode === 'PRODUCT_UNAVAILABLE');

    expect(marked.map((line) => line.id)).toEqual([lineId]);
    expect(marked[0]?.amountCents).toBe(42000);
  });
});

describe('parseVersionNumber', () => {
  it.each(['1', '2', '40'])('accepts %s', (raw) => {
    expect(parseVersionNumber(raw)).toBe(Number(raw));
  });

  it.each([
    'abc',
    '0',
    '1.5',
    '-1',
    '',
    '01',
    ' 1',
    '1e3',
    '99999999999999999999',
  ])('rejects %j', (raw) => {
    expect(parseVersionNumber(raw)).toBeNull();
  });
});

describe('isPublicId', () => {
  it('accepts up to 64 characters', () => {
    expect(isPublicId('a'.repeat(64))).toBe(true);
    expect(isPublicId('a'.repeat(65))).toBe(false);
    expect(isPublicId('')).toBe(false);
  });
});
