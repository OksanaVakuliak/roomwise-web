import { describe, expect, it } from 'vitest';
import type { SurfaceMaterials } from '@/lib/room-3d/materials';
import { makeDraftRoom } from '@/test/fixtures/draft';
import en from '../../../../../messages/en.json';
import {
  sceneDescription,
  settleSurfaces,
  surfaceLine,
  surfaceLines,
  type Translate,
} from './scene-description';

const translate = ((key: string, values: Record<string, unknown> = {}) => {
  const template = key
    .split('.')
    .reduce<unknown>(
      (node, part) => (node as Record<string, unknown>)[part],
      en.RoomPreview,
    ) as string;
  return template.replace(/\{(\w+)\}/g, (_, name) => String(values[name]));
}) as Translate;

const labels = { length: '4 m', width: '3 m', height: '2.7 m' };

const color = (productId: string, name: string) =>
  ({ kind: 'color', productId, name, color: null }) as const;

const surfaces: SurfaceMaterials = {
  floor: color('p1', 'Oak'),
  walls: { kind: 'neutral', reason: 'unselected' },
  ceiling: { kind: 'neutral', reason: 'disabled' },
};

describe('surfaceLine', () => {
  it('names the product, a missing choice and an excluded surface', () => {
    expect(surfaceLine(translate, 'floor', surfaces.floor)).toBe('Floor: Oak');
    expect(surfaceLine(translate, 'walls', surfaces.walls)).toBe(
      'Walls: not chosen',
    );
    expect(surfaceLine(translate, 'ceiling', surfaces.ceiling)).toBe(
      'Ceiling: not included in the estimate',
    );
  });

  it('says a picked product is still loading', () => {
    expect(
      surfaceLine(translate, 'floor', { kind: 'neutral', reason: 'loading' }),
    ).toBe('Floor: loading');
  });

  it('lists floor, walls, ceiling in order', () => {
    expect(surfaceLines(translate, surfaces)).toEqual([
      'Floor: Oak',
      'Walls: not chosen',
      'Ceiling: not included in the estimate',
    ]);
  });
});

describe('settleSurfaces', () => {
  const loading = { kind: 'neutral', reason: 'loading' } as const;
  const settled = settleSurfaces({}, surfaces).settled;

  it('returns the single surface whose material changed', () => {
    expect(
      settleSurfaces(settled, { ...surfaces, floor: color('p2', 'Tile') })
        .changed,
    ).toBe('floor');
  });

  it('returns null when nothing or several surfaces changed', () => {
    expect(settleSurfaces(settled, { ...surfaces }).changed).toBeNull();
    expect(
      settleSurfaces(settled, {
        ...surfaces,
        floor: color('p2', 'Tile'),
        walls: color('p3', 'Paint'),
      }).changed,
    ).toBeNull();
  });

  it('treats the same product under another name as unchanged', () => {
    expect(
      settleSurfaces(settled, { ...surfaces, floor: color('p1', 'Дуб') })
        .changed,
    ).toBeNull();
  });

  it('waits for a picked product to load before reporting the change', () => {
    const picking = settleSurfaces(settled, { ...surfaces, walls: loading });
    expect(picking.changed).toBeNull();
    expect(
      settleSurfaces(picking.settled, {
        ...surfaces,
        walls: color('p3', 'Paint'),
      }).changed,
    ).toBe('walls');
  });

  it('does not report a product that was loading from the start', () => {
    const initial = settleSurfaces({}, { ...surfaces, floor: loading });
    expect(settleSurfaces(initial.settled, surfaces).changed).toBeNull();
  });
});

describe('sceneDescription', () => {
  it('gives name, sizes, area and all surfaces', () => {
    const text = sceneDescription({
      t: translate,
      locale: 'en',
      labels: { ...labels, name: 'Living room' },
      room: makeDraftRoom(),
      surfaces,
    });

    expect(text).toContain('Living room');
    expect(text).toContain('area');
    expect(text).toContain('Floor: Oak');
    expect(text).toContain('Walls: not chosen');
    expect(text).toContain('Ceiling: not included in the estimate');
  });

  it('omits the area when the room type is not chosen', () => {
    const text = sceneDescription({
      t: translate,
      locale: 'en',
      labels: { ...labels, name: 'Room' },
      room: makeDraftRoom({ roomTypeCode: null }),
      surfaces,
    });

    expect(text).not.toContain('area');
    expect(text).toContain('Floor: Oak');
  });
});
