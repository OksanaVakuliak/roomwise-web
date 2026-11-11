import { describe, expect, it } from 'vitest';
import { planeIds, roomPlane, roomPlanes, textureRepeat } from './geometry';

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
});
