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

export const planeIds: readonly PlaneId[] = [
  'floor',
  'ceiling',
  'wallBack',
  'wallFront',
  'wallLeft',
  'wallRight',
];

export function roomPlanes({
  lengthM,
  widthM,
  heightM,
}: RoomSize): PlaneSpec[] {
  return [
    {
      id: 'floor',
      surface: 'floor',
      widthM: lengthM,
      heightM: widthM,
      position: [0, 0, 0],
      normal: [0, 1, 0],
    },
    {
      id: 'ceiling',
      surface: 'ceiling',
      widthM: lengthM,
      heightM: widthM,
      position: [0, heightM, 0],
      normal: [0, -1, 0],
    },
    {
      id: 'wallBack',
      surface: 'walls',
      widthM: lengthM,
      heightM,
      position: [0, heightM / 2, -widthM / 2],
      normal: [0, 0, 1],
    },
    {
      id: 'wallFront',
      surface: 'walls',
      widthM: lengthM,
      heightM,
      position: [0, heightM / 2, widthM / 2],
      normal: [0, 0, -1],
    },
    {
      id: 'wallLeft',
      surface: 'walls',
      widthM: widthM,
      heightM,
      position: [-lengthM / 2, heightM / 2, 0],
      normal: [1, 0, 0],
    },
    {
      id: 'wallRight',
      surface: 'walls',
      widthM: widthM,
      heightM,
      position: [lengthM / 2, heightM / 2, 0],
      normal: [-1, 0, 0],
    },
  ];
}

export function roomPlane(plane: PlaneId, room: RoomSize): PlaneSpec {
  const found = roomPlanes(room).find((candidate) => candidate.id === plane);
  if (!found) {
    throw new Error(`Unknown plane ${plane}`);
  }
  return found;
}

export function textureRepeat(
  plane: PlaneId,
  room: RoomSize,
  step: TextureStep,
): [number, number] {
  const { widthM, heightM } = roomPlane(plane, room);
  const longAlongWidth = widthM >= heightM;
  const stepU = longAlongWidth ? step.lengthMm : step.widthMm;
  const stepV = longAlongWidth ? step.widthMm : step.lengthMm;
  return [(widthM * 1000) / stepU, (heightM * 1000) / stepV];
}
