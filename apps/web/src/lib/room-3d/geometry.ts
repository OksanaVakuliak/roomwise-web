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
