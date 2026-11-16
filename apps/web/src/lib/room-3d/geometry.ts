import type { RoomSceneInput, SurfaceKey, TextureStep } from './types';

export type RoomSize = Pick<RoomSceneInput, 'lengthM' | 'widthM' | 'heightM'>;

export type Vec3 = readonly [number, number, number];

export type PlaneId =
  | 'floor'
  | 'ceiling'
  | 'wallBack'
  | 'wallFront'
  | 'wallLeft'
  | 'wallRight';

export type PlaneSpec = {
  id: PlaneId;
  surface: SurfaceKey;
  widthM: number;
  heightM: number;
  position: Vec3;
  normal: Vec3;
};

const planeBuilders: Record<PlaneId, (room: RoomSize) => PlaneSpec> = {
  floor: ({ lengthM, widthM }) => ({
    id: 'floor',
    surface: 'floor',
    widthM: lengthM,
    heightM: widthM,
    position: [0, 0, 0],
    normal: [0, 1, 0],
  }),
  ceiling: ({ lengthM, widthM, heightM }) => ({
    id: 'ceiling',
    surface: 'ceiling',
    widthM: lengthM,
    heightM: widthM,
    position: [0, heightM, 0],
    normal: [0, -1, 0],
  }),
  wallBack: ({ lengthM, widthM, heightM }) => ({
    id: 'wallBack',
    surface: 'walls',
    widthM: lengthM,
    heightM,
    position: [0, heightM / 2, -widthM / 2],
    normal: [0, 0, 1],
  }),
  wallFront: ({ lengthM, widthM, heightM }) => ({
    id: 'wallFront',
    surface: 'walls',
    widthM: lengthM,
    heightM,
    position: [0, heightM / 2, widthM / 2],
    normal: [0, 0, -1],
  }),
  wallLeft: ({ lengthM, widthM, heightM }) => ({
    id: 'wallLeft',
    surface: 'walls',
    widthM,
    heightM,
    position: [-lengthM / 2, heightM / 2, 0],
    normal: [1, 0, 0],
  }),
  wallRight: ({ lengthM, widthM, heightM }) => ({
    id: 'wallRight',
    surface: 'walls',
    widthM,
    heightM,
    position: [lengthM / 2, heightM / 2, 0],
    normal: [-1, 0, 0],
  }),
};

export const planeIds = Object.keys(planeBuilders) as PlaneId[];

export function roomPlane(plane: PlaneId, room: RoomSize): PlaneSpec {
  return planeBuilders[plane](room);
}

export function roomPlanes(room: RoomSize): PlaneSpec[] {
  return planeIds.map((id) => roomPlane(id, room));
}

export function textureRepeat(
  plane: PlaneId,
  room: RoomSize,
  step: TextureStep,
): [number, number] {
  const { widthM, heightM } = roomPlane(plane, room);
  const isHorizontal = plane === 'floor' || plane === 'ceiling';
  const horizontalIsLong = isHorizontal && room.lengthM >= room.widthM;
  const stepU = horizontalIsLong ? step.lengthMm : step.widthMm;
  const stepV = horizontalIsLong ? step.widthMm : step.lengthMm;
  return [(widthM * 1000) / stepU, (heightM * 1000) / stepV];
}

const PLANE_SHADE: Record<PlaneId, number> = {
  ceiling: 1,
  floor: 0.82,
  wallBack: 0.94,
  wallFront: 0.94,
  wallLeft: 0.86,
  wallRight: 0.86,
};

const EDGE_BAND_M = 0.2;
export const EDGE_SHADE = 0.8;

export function planeShade(id: PlaneId): number {
  return PLANE_SHADE[id];
}

export type PlaneShading = {
  xs: number[];
  ys: number[];
  factors: number[];
};

function bandStops(length: number): number[] {
  const band = Math.min(EDGE_BAND_M, length / 4);
  const half = length / 2;
  return [-half, -half + band, half - band, half];
}

export function planeShading(spec: PlaneSpec): PlaneShading {
  const xs = bandStops(spec.widthM);
  const ys = bandStops(spec.heightM);
  const shade = planeShade(spec.id);
  const edgeFactor = (index: number) =>
    index === 0 || index === 3 ? EDGE_SHADE : 1;
  const factors = ys.flatMap((_, row) =>
    xs.map((_, column) => shade * edgeFactor(column) * edgeFactor(row)),
  );
  return { xs, ys, factors };
}
