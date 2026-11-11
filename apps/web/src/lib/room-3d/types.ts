export type SurfaceKey = 'floor' | 'walls' | 'ceiling';

export type TextureStep = {
  widthMm: number;
  lengthMm: number;
};

export type SceneMaterial =
  | { kind: 'neutral'; reason: 'disabled' | 'unselected' }
  | { kind: 'color'; productId: string; name: string; color: string | null }
  | {
      kind: 'texture';
      productId: string;
      name: string;
      color: string;
      textureUrl: string;
      previewUrl: string | null;
      textureStepMm: TextureStep;
    };

export type RoomSceneInput = {
  roomKey: string;
  lengthM: number;
  widthM: number;
  heightM: number;
  surfaces: Record<SurfaceKey, SceneMaterial>;
};

export type CameraView = {
  azimuth: number;
  polar: number;
  distance: number;
};

export type SceneColors = {
  background: string;
  neutral: string;
  edge: string;
};

export type SceneStatus = 'loading' | 'ready' | 'error' | 'lost';
