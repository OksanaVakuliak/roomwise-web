import { describe, expect, it } from 'vitest';
import {
  cameraLimits,
  cameraPosition,
  cameraTarget,
  clampView,
  defaultView,
  fovDegrees,
  stepView,
  topView,
  visibleFaces,
} from './camera';
import type { PlaneId, RoomSize } from './geometry';
import type { CameraView } from './types';

const rooms: RoomSize[] = [
  { lengthM: 5, widthM: 3, heightM: 2.7 },
  { lengthM: 12, widthM: 1.2, heightM: 2.7 },
  { lengthM: 4, widthM: 3, heightM: 0.5 },
  { lengthM: 3, widthM: 3, heightM: 10 },
];
const aspects = [0.4, 1, 1.78, 3];
const room = rooms[0];

function corners({ lengthM, widthM, heightM }: RoomSize): number[][] {
  const result: number[][] = [];
  for (const x of [-lengthM / 2, lengthM / 2]) {
    for (const y of [0, heightM]) {
      for (const z of [-widthM / 2, widthM / 2]) {
        result.push([x, y, z]);
      }
    }
  }
  return result;
}

function normalize(v: number[]): number[] {
  const length = Math.hypot(...v);
  return v.map((component) => component / length);
}

function cross(a: number[], b: number[]): number[] {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function dot(a: number[], b: number[]): number {
  return a.reduce((sum, value, index) => sum + value * b[index], 0);
}

function fitsFrame(size: RoomSize, view: CameraView, aspect: number): boolean {
  const camera = cameraPosition(view, size);
  const target = cameraTarget(size);
  const forward = normalize(target.map((value, axis) => value - camera[axis]));
  const right = normalize(cross(forward, [0, 1, 0]));
  const up = cross(right, forward);
  const tanVertical = Math.tan((fovDegrees * Math.PI) / 360);
  const tanHorizontal = tanVertical * aspect;

  return corners(size).every((corner) => {
    const offset = corner.map((value, axis) => value - camera[axis]);
    const depth = dot(offset, forward);
    return (
      depth > 0 &&
      Math.abs(dot(offset, right) / depth) <= tanHorizontal &&
      Math.abs(dot(offset, up) / depth) <= tanVertical
    );
  });
}

describe('defaultView', () => {
  it.each(rooms)('fits room %o at every aspect ratio', (size) => {
    for (const aspect of aspects) {
      expect(fitsFrame(size, defaultView(size, aspect), aspect)).toBe(true);
    }
  });

  it('starts at azimuth 35 and polar 55 degrees', () => {
    const view = defaultView(room, 1.5);

    expect(view.azimuth).toBeCloseTo((35 * Math.PI) / 180, 10);
    expect(view.polar).toBeCloseTo((55 * Math.PI) / 180, 10);
  });

  it('keeps the default distance inside the limits', () => {
    for (const size of rooms) {
      for (const aspect of aspects) {
        const { distance } = defaultView(size, aspect);
        const limits = cameraLimits(size, aspect);

        expect(distance).toBeGreaterThanOrEqual(limits.minDistance);
        expect(distance).toBeLessThanOrEqual(limits.maxDistance);
      }
    }
  });
});

describe('cameraLimits', () => {
  it('keeps the camera outside the bounding sphere and bounds the polar angle', () => {
    const limits = cameraLimits(room, 1.5);
    const radius = Math.hypot(5, 3, 2.7) / 2;

    expect(limits.minDistance).toBeCloseTo(radius * 1.15, 10);
    expect(limits.maxDistance).toBeGreaterThanOrEqual(radius * 3.5);
    expect(limits.minPolar).toBe(0.05);
    expect(limits.maxPolar).toBe(1.4);
  });

  it('clamps a view into the limits', () => {
    const limits = cameraLimits(room, 1.5);
    const view = clampView({ azimuth: 1, polar: 3, distance: 0.1 }, limits);

    expect(view.polar).toBe(1.4);
    expect(view.distance).toBe(limits.minDistance);
    expect(view.azimuth).toBe(1);
  });
});

describe('topView', () => {
  it('sets the polar angle to 0.05 and keeps azimuth and distance', () => {
    const view = defaultView(room, 1.5);

    expect(topView(view)).toEqual({ ...view, polar: 0.05 });
  });
});

describe('stepView', () => {
  const limits = cameraLimits(room, 1.5);
  const view = { azimuth: 0.5, polar: 0.9, distance: limits.minDistance * 2 };
  const tenDegrees = (10 * Math.PI) / 180;

  it('rotates by 15 degrees and tilts by 10 degrees', () => {
    expect(stepView(view, 'ArrowRight', limits)?.azimuth).toBeCloseTo(
      0.5 + Math.PI / 12,
      10,
    );
    expect(stepView(view, 'ArrowLeft', limits)?.azimuth).toBeCloseTo(
      0.5 - Math.PI / 12,
      10,
    );
    expect(stepView(view, 'ArrowDown', limits)?.polar).toBeCloseTo(
      0.9 + tenDegrees,
      10,
    );
    expect(stepView(view, 'ArrowUp', limits)?.polar).toBeCloseTo(
      0.9 - tenDegrees,
      10,
    );
  });

  it('zooms by 0.85 and 1.15', () => {
    expect(stepView(view, '+', limits)?.distance).toBeCloseTo(
      view.distance * 0.85,
      10,
    );
    expect(stepView(view, '−', limits)?.distance).toBeCloseTo(
      view.distance * 1.15,
      10,
    );
  });

  it('stays within the limits', () => {
    const closest = {
      ...view,
      distance: limits.minDistance,
      polar: limits.maxPolar,
    };

    expect(stepView(closest, '+', limits)?.distance).toBe(limits.minDistance);
    expect(stepView(closest, 'ArrowDown', limits)?.polar).toBe(limits.maxPolar);
    expect(stepView({ ...view, polar: 0.05 }, 'ArrowUp', limits)?.polar).toBe(
      0.05,
    );
  });

  it('ignores other keys', () => {
    expect(stepView(view, 'a', limits)).toBeNull();
  });
});

describe('visibleFaces', () => {
  it('hides the ceiling and shows the floor from the default view', () => {
    const faces = visibleFaces(defaultView(room, 1.5), room);

    expect(faces).toContain('floor');
    expect(faces).not.toContain('ceiling');
  });

  it('hides the walls nearest to the camera and shows the far ones', () => {
    const cases: [number, PlaneId, PlaneId][] = [
      [0, 'wallFront', 'wallBack'],
      [Math.PI / 2, 'wallRight', 'wallLeft'],
      [Math.PI, 'wallBack', 'wallFront'],
      [-Math.PI / 2, 'wallLeft', 'wallRight'],
    ];

    for (const [azimuth, hidden, shown] of cases) {
      const faces = visibleFaces({ azimuth, polar: 0.9, distance: 12 }, room);

      expect(faces).not.toContain(hidden);
      expect(faces).toContain(shown);
    }
  });

  it('shows the ceiling only when the camera is below it', () => {
    const limits = cameraLimits(room, 1.5);
    const low = {
      azimuth: 0.6,
      polar: limits.maxPolar,
      distance: limits.minDistance,
    };
    const high = { ...low, polar: 0.5 };

    expect(cameraPosition(low, room)[1]).toBeLessThan(room.heightM);
    expect(visibleFaces(low, room)).toContain('ceiling');
    expect(cameraPosition(high, room)[1]).toBeGreaterThan(room.heightM);
    expect(visibleFaces(high, room)).not.toContain('ceiling');
  });

  it('hides the ceiling from the top view', () => {
    expect(visibleFaces(topView(defaultView(room, 1.5)), room)).not.toContain(
      'ceiling',
    );
  });
});
