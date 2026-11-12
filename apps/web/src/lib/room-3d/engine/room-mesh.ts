import {
  EdgesGeometry,
  FrontSide,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
} from 'three';
import {
  type PlaneId,
  type PlaneSpec,
  planeIds,
  type RoomSize,
  roomPlanes,
} from '../geometry';
import type { SceneColors } from '../types';

type PlaneEntry = {
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

function createPlane(spec: PlaneSpec, colors: SceneColors): PlaneEntry {
  const geometry = new PlaneGeometry(spec.widthM, spec.heightM);
  const mesh = new Mesh(
    geometry,
    new MeshBasicMaterial({ color: colors.neutral, side: FrontSide }),
  );
  const edges = new LineSegments(
    new EdgesGeometry(geometry),
    new LineBasicMaterial({ color: colors.edge }),
  );
  mesh.name = spec.id;
  edges.name = `${spec.id}-edges`;
  const entry = { mesh, edges };
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
    entry.mesh.geometry = new PlaneGeometry(spec.widthM, spec.heightM);
    entry.edges.geometry = new EdgesGeometry(entry.mesh.geometry);
    placePlane(entry, spec);
  }
}

export function setRoomMeshColors(roomMesh: RoomMesh, colors: SceneColors) {
  for (const id of planeIds) {
    const { mesh, edges } = roomMesh.planes[id];
    mesh.material.color.set(colors.neutral);
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
    const { mesh, edges } = roomMesh.planes[id];
    mesh.geometry.dispose();
    mesh.material.dispose();
    edges.geometry.dispose();
    edges.material.dispose();
  }
  roomMesh.group.clear();
}
