import { type PlaneId, type RoomSize, roomPlanes, type Vec3 } from './geometry';
import type { CameraView } from './types';

export type CameraLimits = {
  minDistance: number;
  maxDistance: number;
  minPolar: number;
  maxPolar: number;
};

export const fovDegrees = 40;
export const defaultAzimuth = (35 * Math.PI) / 180;
export const defaultPolar = (55 * Math.PI) / 180;
export const topPolar = 0.05;

const minPolar = 0.05;
const maxPolar = 1.4;
const fitMargin = 1.05;
const azimuthStep = (15 * Math.PI) / 180;
const polarStep = (10 * Math.PI) / 180;

export function sceneRadius({ lengthM, widthM, heightM }: RoomSize): number {
  return Math.hypot(lengthM, widthM, heightM) / 2;
}

export function cameraTarget({ heightM }: RoomSize): Vec3 {
  return [0, heightM / 2, 0];
}

function fitDistance(room: RoomSize, aspect: number): number {
  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 1;
  const halfVertical = (fovDegrees * Math.PI) / 360;
  const halfHorizontal = Math.atan(Math.tan(halfVertical) * safeAspect);
  return (
    (sceneRadius(room) / Math.sin(Math.min(halfVertical, halfHorizontal))) *
    fitMargin
  );
}

export function cameraLimits(room: RoomSize, aspect: number): CameraLimits {
  const radius = sceneRadius(room);
  return {
    minDistance: radius * 1.15,
    maxDistance: Math.max(radius * 3.5, fitDistance(room, aspect) * 1.2),
    minPolar,
    maxPolar,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function clampView(view: CameraView, limits: CameraLimits): CameraView {
  return {
    azimuth: view.azimuth,
    polar: clamp(view.polar, limits.minPolar, limits.maxPolar),
    distance: clamp(view.distance, limits.minDistance, limits.maxDistance),
  };
}

export function defaultView(room: RoomSize, aspect: number): CameraView {
  return clampView(
    {
      azimuth: defaultAzimuth,
      polar: defaultPolar,
      distance: fitDistance(room, aspect),
    },
    cameraLimits(room, aspect),
  );
}

export function topView(view: CameraView): CameraView {
  return { ...view, polar: topPolar };
}

export function stepView(
  view: CameraView,
  key: string,
  limits: CameraLimits,
): CameraView | null {
  switch (key) {
    case 'ArrowLeft':
      return clampView(
        { ...view, azimuth: view.azimuth - azimuthStep },
        limits,
      );
    case 'ArrowRight':
      return clampView(
        { ...view, azimuth: view.azimuth + azimuthStep },
        limits,
      );
    case 'ArrowUp':
      return clampView({ ...view, polar: view.polar - polarStep }, limits);
    case 'ArrowDown':
      return clampView({ ...view, polar: view.polar + polarStep }, limits);
    case '+':
    case '=':
      return clampView({ ...view, distance: view.distance * 0.85 }, limits);
    case '-':
    case '−':
      return clampView({ ...view, distance: view.distance * 1.15 }, limits);
    default:
      return null;
  }
}

export function cameraPosition(view: CameraView, room: RoomSize): Vec3 {
  const [x, y, z] = cameraTarget(room);
  const horizontal = view.distance * Math.sin(view.polar);
  return [
    x + horizontal * Math.sin(view.azimuth),
    y + view.distance * Math.cos(view.polar),
    z + horizontal * Math.cos(view.azimuth),
  ];
}

export function visibleFaces(view: CameraView, room: RoomSize): PlaneId[] {
  const camera = cameraPosition(view, room);
  return roomPlanes(room)
    .filter((plane) => {
      const facing = plane.normal.reduce(
        (sum, component, axis) =>
          sum + component * (camera[axis] - plane.position[axis]),
        0,
      );
      return facing > 0;
    })
    .map((plane) => plane.id);
}
