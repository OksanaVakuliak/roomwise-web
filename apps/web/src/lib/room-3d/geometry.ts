import type {
  CameraView,
  RoomSceneInput,
  SurfaceKey,
  TextureStep,
} from './types';

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

export type DimensionKey = 'length' | 'width' | 'height';

export type Segment3 = readonly [Vec3, Vec3];

export type DimensionLine = {
  key: DimensionKey;
  segments: Segment3[];
  label: Vec3;
};

export type DimensionSector = { sx: 1 | -1; sz: 1 | -1; height: boolean };

const DIMENSION_OFFSET_M = 0.35;
const EXTENSION_GAP_M = 0.08;
const EXTENSION_OVERSHOOT_M = 0.12;
const TICK_M = 0.1;
const HEIGHT_MIN_POLAR = 0.35;

export function dimensionSector(
  view: Pick<CameraView, 'azimuth' | 'polar'>,
): DimensionSector {
  return {
    sx: Math.sin(view.azimuth) >= 0 ? 1 : -1,
    sz: Math.cos(view.azimuth) >= 0 ? 1 : -1,
    height: view.polar >= HEIGHT_MIN_POLAR,
  };
}

function groundTick([x, y, z]: Vec3): Segment3 {
  return [
    [x - TICK_M, y, z - TICK_M],
    [x + TICK_M, y, z + TICK_M],
  ];
}

function verticalTick([x, y, z]: Vec3): Segment3 {
  return [
    [x - TICK_M, y - TICK_M, z],
    [x + TICK_M, y + TICK_M, z],
  ];
}

function midpoint([a, b]: Segment3): Vec3 {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
}

function dimensionLine(
  key: DimensionKey,
  line: Segment3,
  extensions: Segment3[],
  tick: (point: Vec3) => Segment3,
): DimensionLine {
  return {
    key,
    segments: [line, ...extensions, tick(line[0]), tick(line[1])],
    label: midpoint(line),
  };
}

export function dimensionLines(
  room: RoomSize,
  sector: DimensionSector,
): DimensionLine[] {
  const { lengthM, widthM, heightM } = room;
  const { sx, sz } = sector;
  const halfL = lengthM / 2;
  const halfW = widthM / 2;
  const lineZ = sz * (halfW + DIMENSION_OFFSET_M);
  const lineX = sx * (halfL + DIMENSION_OFFSET_M);
  const nearZ = sz * (halfW + EXTENSION_GAP_M);
  const farZ = sz * (halfW + DIMENSION_OFFSET_M + EXTENSION_OVERSHOOT_M);
  const nearX = sx * (halfL + EXTENSION_GAP_M);
  const farX = sx * (halfL + DIMENSION_OFFSET_M + EXTENSION_OVERSHOOT_M);

  const length = dimensionLine(
    'length',
    [
      [-halfL, 0, lineZ],
      [halfL, 0, lineZ],
    ],
    [-halfL, halfL].map(
      (x): Segment3 => [
        [x, 0, nearZ],
        [x, 0, farZ],
      ],
    ),
    groundTick,
  );
  const width = dimensionLine(
    'width',
    [
      [lineX, 0, -halfW],
      [lineX, 0, halfW],
    ],
    [-halfW, halfW].map(
      (z): Segment3 => [
        [nearX, 0, z],
        [farX, 0, z],
      ],
    ),
    groundTick,
  );
  if (!sector.height) {
    return [length, width];
  }

  const heightZ = -sz * halfW;
  const height = dimensionLine(
    'height',
    [
      [lineX, 0, heightZ],
      [lineX, heightM, heightZ],
    ],
    [
      [
        [nearX, heightM, heightZ],
        [farX, heightM, heightZ],
      ],
    ],
    verticalTick,
  );
  return [length, width, height];
}
