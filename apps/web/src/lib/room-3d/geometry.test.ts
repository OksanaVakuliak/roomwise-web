import { describe, expect, it } from 'vitest';
import {
  type DimensionLine,
  dimensionLines,
  dimensionSector,
  EDGE_SHADE,
  planeIds,
  planeShade,
  planeShading,
  roomPlane,
  roomPlanes,
  textureRepeat,
} from './geometry';

const room = { lengthM: 5, widthM: 3, heightM: 2.7 };
const square = { lengthM: 3, widthM: 3, heightM: 3 };

describe('roomPlanes', () => {
  it('returns the six planes with sizes in metres', () => {
    const planes = roomPlanes(room);

    expect(planes.map((plane) => plane.id)).toEqual([...planeIds]);
    expect(roomPlane('floor', room)).toMatchObject({ widthM: 5, heightM: 3 });
    expect(roomPlane('ceiling', room)).toMatchObject({ widthM: 5, heightM: 3 });
    expect(roomPlane('wallBack', room)).toMatchObject({
      widthM: 5,
      heightM: 2.7,
    });
    expect(roomPlane('wallLeft', room)).toMatchObject({
      widthM: 3,
      heightM: 2.7,
    });
  });

  it('maps planes to surfaces', () => {
    const surfaces = roomPlanes(room).map((plane) => plane.surface);

    expect(surfaces).toEqual([
      'floor',
      'ceiling',
      'walls',
      'walls',
      'walls',
      'walls',
    ]);
  });

  it('points every normal into the room', () => {
    for (const plane of roomPlanes(room)) {
      const inward = [0, room.heightM / 2, 0].map(
        (centre, axis) => centre - plane.position[axis],
      );
      const dot = plane.normal.reduce(
        (sum, value, axis) => sum + value * inward[axis],
        0,
      );

      expect(dot).toBeGreaterThan(0);
    }
  });
});

describe('textureRepeat', () => {
  it('uses realSizeMm as a square step: 1500 mm in a 3 x 3 room gives 2 x 2', () => {
    const [u, v] = textureRepeat('floor', square, {
      widthMm: 1500,
      lengthMm: 1500,
    });

    expect(u).toBeCloseTo(2, 10);
    expect(v).toBeCloseTo(2, 10);
  });

  it('falls back to the 600 x 600 module: 5 x 5', () => {
    const [u, v] = textureRepeat('floor', square, {
      widthMm: 600,
      lengthMm: 600,
    });

    expect(u).toBeCloseTo(5, 10);
    expect(v).toBeCloseTo(5, 10);
  });

  it('runs the long side of a laminate plank along the longer side of the surface', () => {
    const step = { widthMm: 130, lengthMm: 1200 };
    const [u, v] = textureRepeat('floor', room, step);

    expect(u).toBeCloseTo(5000 / 1200, 10);
    expect(v).toBeCloseTo(3000 / 130, 10);

    const [tallU, tallV] = textureRepeat(
      'wallLeft',
      { lengthM: 5, widthM: 1, heightM: 2.7 },
      step,
    );
    expect(tallU).toBeCloseTo(1000 / 130, 10);
    expect(tallV).toBeCloseTo(2700 / 1200, 10);
  });

  it('keeps the physical size of a repeat within 5% on every plane', () => {
    const step = { widthMm: 600, lengthMm: 600 };

    for (const id of planeIds) {
      const plane = roomPlane(id, room);
      const [u, v] = textureRepeat(id, room, step);

      expect(Math.abs((plane.widthM * 1000) / u - 600) / 600).toBeLessThan(
        0.05,
      );
      expect(Math.abs((plane.heightM * 1000) / v - 600) / 600).toBeLessThan(
        0.05,
      );
    }
  });

  it('orients every wall the same way: U follows the step width, V its length', () => {
    const narrow = { lengthM: 5, widthM: 1, heightM: 2.7 };
    const step = { widthMm: 300, lengthMm: 600 };
    const walls = ['wallBack', 'wallFront', 'wallLeft', 'wallRight'] as const;

    for (const id of walls) {
      const plane = roomPlane(id, narrow);
      const [u, v] = textureRepeat(id, narrow, step);

      expect(u).toBeCloseTo((plane.widthM * 1000) / 300, 10);
      expect(v).toBeCloseTo((plane.heightM * 1000) / 600, 10);
    }
  });

  it('orients floor and ceiling identically, with the step length along the longer room side', () => {
    const step = { widthMm: 130, lengthMm: 1200 };
    const wide = { lengthM: 3, widthM: 5, heightM: 2.7 };

    expect(textureRepeat('ceiling', room, step)).toEqual(
      textureRepeat('floor', room, step),
    );
    expect(textureRepeat('ceiling', wide, step)).toEqual(
      textureRepeat('floor', wide, step),
    );

    const [u, v] = textureRepeat('floor', wide, step);
    expect(u).toBeCloseTo(3000 / 130, 10);
    expect(v).toBeCloseTo(5000 / 1200, 10);
  });

  it('runs the step length along the room length axis on a square room', () => {
    const [u, v] = textureRepeat('floor', square, {
      widthMm: 300,
      lengthMm: 600,
    });

    expect(u).toBeCloseTo(3000 / 600, 10);
    expect(v).toBeCloseTo(3000 / 300, 10);
  });
});

describe('planeShade', () => {
  it('lights the ceiling most and the floor least', () => {
    for (const id of planeIds) {
      expect(planeShade(id)).toBeLessThanOrEqual(planeShade('ceiling'));
      expect(planeShade(id)).toBeGreaterThanOrEqual(planeShade('floor'));
    }
  });

  it('shades adjacent walls differently', () => {
    expect(planeShade('wallBack')).not.toBe(planeShade('wallLeft'));
    expect(planeShade('wallBack')).not.toBe(planeShade('wallRight'));
    expect(planeShade('wallFront')).not.toBe(planeShade('wallLeft'));
    expect(planeShade('wallFront')).not.toBe(planeShade('wallRight'));
  });
});

describe('planeShading', () => {
  const at = (factors: number[], row: number, column: number) =>
    factors[row * 4 + column];

  it('darkens the edge bands and corners of a plane', () => {
    const spec = roomPlane('wallBack', room);
    const shade = planeShade('wallBack');
    const { xs, ys, factors } = planeShading(spec);

    expect(xs).toEqual([-2.5, -2.3, 2.3, 2.5]);
    expect(ys[0]).toBeCloseTo(-1.35);
    expect(ys[1]).toBeCloseTo(-1.15);
    expect(ys[2]).toBeCloseTo(1.15);
    expect(ys[3]).toBeCloseTo(1.35);
    expect(at(factors, 1, 1)).toBeCloseTo(shade);
    expect(at(factors, 2, 2)).toBeCloseTo(shade);
    expect(at(factors, 1, 0)).toBeCloseTo(shade * EDGE_SHADE);
    expect(at(factors, 3, 2)).toBeCloseTo(shade * EDGE_SHADE);
    expect(at(factors, 0, 0)).toBeCloseTo(shade * EDGE_SHADE * EDGE_SHADE);
    expect(at(factors, 3, 3)).toBeCloseTo(shade * EDGE_SHADE * EDGE_SHADE);
  });

  it('keeps the bands inside a tiny plane', () => {
    const tiny = { lengthM: 0.5, widthM: 0.5, heightM: 0.5 };
    const { xs, ys } = planeShading(roomPlane('wallBack', tiny));

    for (const stops of [xs, ys]) {
      expect(stops[0]).toBeLessThan(stops[1]);
      expect(stops[1]).toBeLessThan(stops[2]);
      expect(stops[2]).toBeLessThan(stops[3]);
      expect(stops[1]).toBeCloseTo(-0.125);
      expect(stops[2]).toBeCloseTo(0.125);
    }
  });
});

describe('dimensionSector', () => {
  const deg = (value: number) => (value * Math.PI) / 180;
  const polar = deg(55);

  it('picks the edges nearer the camera in all four quadrants', () => {
    expect(dimensionSector({ azimuth: deg(35), polar })).toMatchObject({
      sx: 1,
      sz: 1,
    });
    expect(dimensionSector({ azimuth: deg(125), polar })).toMatchObject({
      sx: 1,
      sz: -1,
    });
    expect(dimensionSector({ azimuth: deg(215), polar })).toMatchObject({
      sx: -1,
      sz: -1,
    });
    expect(dimensionSector({ azimuth: deg(305), polar })).toMatchObject({
      sx: -1,
      sz: 1,
    });
  });

  it('shows the height from the default polar angle and hides it in top view', () => {
    expect(dimensionSector({ azimuth: 0, polar }).height).toBe(true);
    expect(dimensionSector({ azimuth: 0, polar: 0.05 }).height).toBe(false);
  });
});

describe('dimensionLines', () => {
  const sectors = [
    { sx: 1, sz: 1 },
    { sx: 1, sz: -1 },
    { sx: -1, sz: -1 },
    { sx: -1, sz: 1 },
  ] as const;
  const byKey = (lines: ReturnType<typeof dimensionLines>, key: string) => {
    const line = lines.find((item) => item.key === key);
    if (!line) {
      throw new Error(`missing ${key}`);
    }
    return line;
  };
  const distance = (a: readonly number[], b: readonly number[]) =>
    Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

  it('places the lines outside the room on the side nearer the camera', () => {
    for (const { sx, sz } of sectors) {
      const lines = dimensionLines(room, { sx, sz, height: true });
      const [lengthStart] = byKey(lines, 'length').segments[0];
      const [widthStart] = byKey(lines, 'width').segments[0];

      expect(Math.sign(lengthStart[2])).toBe(sz);
      expect(Math.abs(lengthStart[2])).toBeGreaterThan(room.widthM / 2);
      expect(Math.sign(widthStart[0])).toBe(sx);
      expect(Math.abs(widthStart[0])).toBeGreaterThan(room.lengthM / 2);
    }
  });

  it('keeps every point off the room footprint interior', () => {
    for (const { sx, sz } of sectors) {
      for (const line of dimensionLines(room, { sx, sz, height: true })) {
        for (const point of line.segments.flat()) {
          const outsideX = Math.abs(point[0]) >= room.lengthM / 2 - 0.1;
          const outsideZ = Math.abs(point[2]) >= room.widthM / 2 - 0.1;
          expect(outsideX || outsideZ).toBe(true);
        }
      }
    }
  });

  it('anchors each label at the midpoint of its dimension line', () => {
    const lines = dimensionLines(room, { sx: 1, sz: 1, height: true });

    expect(byKey(lines, 'length').label[0]).toBeCloseTo(0);
    expect(byKey(lines, 'width').label[2]).toBeCloseTo(0);
    expect(byKey(lines, 'height').label[1]).toBeCloseTo(room.heightM / 2);
  });

  it('measures the real size of an elongated room', () => {
    const long = { lengthM: 12, widthM: 1.2, heightM: 2.7 };
    const lines = dimensionLines(long, { sx: -1, sz: 1, height: true });
    const span = (key: string) => {
      const [start, end] = byKey(lines, key).segments[0];
      return distance(start, end);
    };

    expect(span('length')).toBeCloseTo(12);
    expect(span('width')).toBeCloseTo(1.2);
    expect(span('height')).toBeCloseTo(2.7);
  });

  it('returns only length and width without the height', () => {
    const lines = dimensionLines(room, { sx: 1, sz: 1, height: false });

    expect(lines.map((line) => line.key)).toEqual(['length', 'width']);
  });

  it('lifts length and width to the top of the walls without the height', () => {
    const top = dimensionLines(room, { sx: 1, sz: 1, height: false });
    const side = dimensionLines(room, { sx: 1, sz: 1, height: true });
    const heights = (lines: DimensionLine[]) =>
      lines
        .filter((line) => line.key !== 'height')
        .flatMap((line) => line.segments.flat().map((point) => point[1]));

    expect(new Set(heights(top))).toEqual(new Set([room.heightM]));
    expect(new Set(heights(side))).toEqual(new Set([0]));
  });
});
