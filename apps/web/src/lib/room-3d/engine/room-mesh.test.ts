import { FrontSide, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { planeIds, roomPlanes } from '../geometry';
import type { SceneColors } from '../types';
import {
  createRoomMesh,
  disposeRoomMesh,
  rebuildRoomMesh,
  setRoomMeshColors,
  setRoomMeshEdges,
} from './room-mesh';

const room = { lengthM: 5, widthM: 3, heightM: 2.7 };
const colors: SceneColors = {
  background: '#ffffff',
  neutral: '#cccccc',
  edge: '#222222',
};

describe('room mesh', () => {
  it('builds one front-sided basic plane per surface facing into the room', () => {
    const { planes } = createRoomMesh(room, colors);
    for (const spec of roomPlanes(room)) {
      const { mesh } = planes[spec.id];
      const normal = new Vector3(0, 0, 1).applyEuler(mesh.rotation);
      expect(normal.x).toBeCloseTo(spec.normal[0]);
      expect(normal.y).toBeCloseTo(spec.normal[1]);
      expect(normal.z).toBeCloseTo(spec.normal[2]);
      expect(mesh.position.toArray()).toEqual([...spec.position]);
      expect(mesh.geometry.parameters.width).toBe(spec.widthM);
      expect(mesh.geometry.parameters.height).toBe(spec.heightM);
      expect(mesh.material.type).toBe('MeshBasicMaterial');
      expect(mesh.material.side).toBe(FrontSide);
      expect(mesh.material.polygonOffset).toBe(true);
      expect(mesh.material.polygonOffsetFactor).toBeGreaterThan(0);
    }
  });

  it('colours surfaces and edges from the scene colours', () => {
    const roomMesh = createRoomMesh(room, colors);
    setRoomMeshColors(roomMesh, { ...colors, neutral: '#ff0000' });
    expect(roomMesh.planes.floor.mesh.material.color.getHexString()).toBe(
      'ff0000',
    );
    expect(roomMesh.planes.floor.edges.material.color.getHexString()).toBe(
      '222222',
    );
  });

  it('shows edges only for the listed planes', () => {
    const roomMesh = createRoomMesh(room, colors);
    setRoomMeshEdges(roomMesh, ['floor', 'wallBack']);
    const shown = planeIds.filter((id) => roomMesh.planes[id].edges.visible);
    expect(shown).toEqual(['floor', 'wallBack']);
  });

  it('rebuilds geometry for a new size and reuses the meshes', () => {
    const roomMesh = createRoomMesh(room, colors);
    const floor = roomMesh.planes.floor.mesh;
    rebuildRoomMesh(roomMesh, { lengthM: 8, widthM: 4, heightM: 3 });
    expect(roomMesh.planes.floor.mesh).toBe(floor);
    expect(floor.geometry.parameters.width).toBe(8);
    expect(floor.geometry.parameters.height).toBe(4);
    expect(roomMesh.planes.ceiling.mesh.position.y).toBe(3);
  });

  it('disposes geometries and materials', () => {
    const roomMesh = createRoomMesh(room, colors);
    let disposed = 0;
    for (const id of planeIds) {
      const { mesh, edges } = roomMesh.planes[id];
      for (const resource of [
        mesh.geometry,
        mesh.material,
        edges.geometry,
        edges.material,
      ]) {
        resource.addEventListener('dispose', () => {
          disposed += 1;
        });
      }
    }
    disposeRoomMesh(roomMesh);
    expect(disposed).toBe(planeIds.length * 4);
    expect(roomMesh.group.children).toHaveLength(0);
  });
});
