import {
  BufferAttribute,
  BufferGeometry,
  LineBasicMaterial,
  LineSegments,
} from 'three';
import {
  type DimensionLine,
  type DimensionSector,
  dimensionLines,
  type RoomSize,
} from '../geometry';
import type { SceneColors } from '../types';

export type DimensionLinesState = {
  object: LineSegments<BufferGeometry, LineBasicMaterial>;
  lines: DimensionLine[];
  key: string;
};

function stateKey(room: RoomSize, sector: DimensionSector): string {
  const { lengthM, widthM, heightM } = room;
  return [lengthM, widthM, heightM, sector.sx, sector.sz, sector.height].join(
    ':',
  );
}

export function createDimensionLines(colors: SceneColors): DimensionLinesState {
  const object = new LineSegments(
    new BufferGeometry(),
    new LineBasicMaterial({ color: colors.edge }),
  );
  object.name = 'dimension-lines';
  object.frustumCulled = false;
  return { object, lines: [], key: '' };
}

export function updateDimensionLines(
  state: DimensionLinesState,
  room: RoomSize,
  sector: DimensionSector,
) {
  const key = stateKey(room, sector);
  if (key === state.key) return;
  state.key = key;
  state.lines = dimensionLines(room, sector);
  const positions = state.lines.flatMap(({ segments }) =>
    segments.flatMap(([start, end]) => [...start, ...end]),
  );
  state.object.geometry.dispose();
  state.object.geometry = new BufferGeometry();
  state.object.geometry.setAttribute(
    'position',
    new BufferAttribute(new Float32Array(positions), 3),
  );
}

export function setDimensionLinesColor(
  state: DimensionLinesState,
  colors: SceneColors,
) {
  state.object.material.color.set(colors.edge);
}

export function disposeDimensionLines(state: DimensionLinesState) {
  state.object.geometry.dispose();
  state.object.material.dispose();
}
