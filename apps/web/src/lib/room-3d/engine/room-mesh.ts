import {
  BufferAttribute,
  EdgesGeometry,
  FrontSide,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  type Texture,
} from 'three';
import {
  type PlaneId,
  type PlaneSpec,
  planeIds,
  planeShading,
  type RoomSize,
  roomPlanes,
  textureRepeat,
} from '../geometry';
import type {
  SceneColors,
  SceneMaterial,
  SurfaceKey,
  TextureStep,
} from '../types';

const TEXTURE_TINT = '#ffffff';
const EDGE_OPACITY_OVER_MATERIAL = 0.35;
const GRID_STOPS = 4;

type PlaneEntry = {
  surface: SurfaceKey;
  neutral: boolean;
  texture: Texture | null;
  step: TextureStep | null;
  mesh: Mesh<PlaneGeometry, MeshBasicMaterial>;
  edges: LineSegments<EdgesGeometry, LineBasicMaterial>;
};

export type RoomMesh = {
  group: Group;
  planes: Record<PlaneId, PlaneEntry>;
};

const rotations: Record<PlaneId, readonly [number, number]> = {
  floor: [-Math.PI / 2, 0],
  ceiling: [Math.PI / 2, 0],
  wallBack: [0, 0],
  wallFront: [0, Math.PI],
  wallLeft: [0, Math.PI / 2],
  wallRight: [0, -Math.PI / 2],
};

function placePlane({ mesh, edges }: PlaneEntry, spec: PlaneSpec) {
  const [rotationX, rotationY] = rotations[spec.id];
  for (const object of [mesh, edges]) {
    object.position.set(...spec.position);
    object.rotation.set(rotationX, rotationY, 0);
  }
}

function createPlaneGeometry(spec: PlaneSpec): PlaneGeometry {
  const geometry = new PlaneGeometry(
    spec.widthM,
    spec.heightM,
    GRID_STOPS - 1,
    GRID_STOPS - 1,
  );
  const { xs, ys, factors } = planeShading(spec);
  const position = geometry.getAttribute('position');
  const uv = geometry.getAttribute('uv');
  const colors = new Float32Array(position.count * 3);
  for (let row = 0; row < GRID_STOPS; row++) {
    for (let column = 0; column < GRID_STOPS; column++) {
      const vertex = row * GRID_STOPS + column;
      const x = xs[column];
      const y = ys[GRID_STOPS - 1 - row];
      const factor = factors[(GRID_STOPS - 1 - row) * GRID_STOPS + column];
      position.setXY(vertex, x, y);
      uv.setXY(
        vertex,
        (x + spec.widthM / 2) / spec.widthM,
        (y + spec.heightM / 2) / spec.heightM,
      );
      colors.fill(factor, vertex * 3, vertex * 3 + 3);
    }
  }
  geometry.setAttribute('color', new BufferAttribute(colors, 3));
  return geometry;
}

function createEdgesGeometry(spec: PlaneSpec): EdgesGeometry {
  const outline = new PlaneGeometry(spec.widthM, spec.heightM);
  const edges = new EdgesGeometry(outline);
  outline.dispose();
  return edges;
}

function edgeOpacity(neutral: boolean): number {
  return neutral ? 1 : EDGE_OPACITY_OVER_MATERIAL;
}

function createPlane(spec: PlaneSpec, colors: SceneColors): PlaneEntry {
  const geometry = createPlaneGeometry(spec);
  const mesh = new Mesh(
    geometry,
    new MeshBasicMaterial({
      color: colors.neutral,
      vertexColors: true,
      side: FrontSide,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    }),
  );
  const edges = new LineSegments(
    createEdgesGeometry(spec),
    new LineBasicMaterial({
      color: colors.edge,
      transparent: true,
      opacity: edgeOpacity(true),
    }),
  );
  mesh.name = spec.id;
  edges.name = `${spec.id}-edges`;
  const entry = {
    surface: spec.surface,
    neutral: true,
    texture: null,
    step: null,
    mesh,
    edges,
  };
  placePlane(entry, spec);
  return entry;
}

export function createRoomMesh(room: RoomSize, colors: SceneColors): RoomMesh {
  const group = new Group();
  const planes = {} as Record<PlaneId, PlaneEntry>;
  for (const spec of roomPlanes(room)) {
    const entry = createPlane(spec, colors);
    planes[spec.id] = entry;
    group.add(entry.mesh, entry.edges);
  }
  return { group, planes };
}

export function rebuildRoomMesh(roomMesh: RoomMesh, room: RoomSize) {
  for (const spec of roomPlanes(room)) {
    const entry = roomMesh.planes[spec.id];
    entry.mesh.geometry.dispose();
    entry.edges.geometry.dispose();
    entry.mesh.geometry = createPlaneGeometry(spec);
    entry.edges.geometry = createEdgesGeometry(spec);
    placePlane(entry, spec);
    if (entry.texture && entry.step) {
      entry.texture.repeat.set(...textureRepeat(spec.id, room, entry.step));
    }
  }
}

function clearTexture(entry: PlaneEntry) {
  entry.texture?.dispose();
  entry.texture = null;
  entry.step = null;
  if (entry.mesh.material.map) {
    entry.mesh.material.map = null;
    entry.mesh.material.needsUpdate = true;
  }
}

function surfaceEntries(roomMesh: RoomMesh, surface: SurfaceKey) {
  return planeIds
    .map((id) => ({ id, entry: roomMesh.planes[id] }))
    .filter(({ entry }) => entry.surface === surface);
}

function isNeutral(material: SceneMaterial): boolean {
  return material.kind === 'neutral' || !material.color;
}

export function setRoomMeshSurface(
  roomMesh: RoomMesh,
  surface: SurfaceKey,
  material: SceneMaterial,
  colors: SceneColors,
) {
  const neutral = isNeutral(material);
  const color = material.kind === 'neutral' ? null : material.color;
  for (const { entry } of surfaceEntries(roomMesh, surface)) {
    clearTexture(entry);
    entry.neutral = neutral;
    entry.edges.material.opacity = edgeOpacity(neutral);
    entry.mesh.material.color.set(color || colors.neutral);
  }
}

export function setRoomMeshTexture(
  roomMesh: RoomMesh,
  surface: SurfaceKey,
  texture: Texture,
  step: TextureStep,
  room: RoomSize,
) {
  for (const { id, entry } of surfaceEntries(roomMesh, surface)) {
    entry.texture?.dispose();
    const clone = texture.clone();
    clone.repeat.set(...textureRepeat(id, room, step));
    entry.texture = clone;
    entry.step = step;
    entry.neutral = false;
    entry.edges.material.opacity = edgeOpacity(false);
    entry.mesh.material.map = clone;
    entry.mesh.material.color.set(TEXTURE_TINT);
    entry.mesh.material.needsUpdate = true;
  }
}

export function setRoomMeshColors(roomMesh: RoomMesh, colors: SceneColors) {
  for (const id of planeIds) {
    const { mesh, edges, neutral } = roomMesh.planes[id];
    if (neutral) mesh.material.color.set(colors.neutral);
    edges.material.color.set(colors.edge);
  }
}

export function setRoomMeshEdges(roomMesh: RoomMesh, visible: PlaneId[]) {
  for (const id of planeIds) {
    roomMesh.planes[id].edges.visible = visible.includes(id);
  }
}

export function disposeRoomMesh(roomMesh: RoomMesh) {
  for (const id of planeIds) {
    const entry = roomMesh.planes[id];
    const { mesh, edges } = entry;
    clearTexture(entry);
    mesh.geometry.dispose();
    mesh.material.dispose();
    edges.geometry.dispose();
    edges.material.dispose();
  }
  roomMesh.group.clear();
}
