import { FrontSide, Texture, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { planeIds, planeShading, roomPlanes } from '../geometry';
import type { SceneColors } from '../types';
import {
  createRoomMesh,
  disposeRoomMesh,
  rebuildRoomMesh,
  setRoomMeshColors,
  setRoomMeshEdges,
  setRoomMeshSurface,
  setRoomMeshTexture,
} from './room-mesh';

const room = { lengthM: 5, widthM: 3, heightM: 2.7 };
const colors: SceneColors = {
  background: '#ffffff',
  neutral: '#cccccc',
  edge: '#222222',
};

describe('room mesh shading', () => {
  it('shades planes with vertex colours without moving the texture mapping', () => {
    const { planes } = createRoomMesh(room, colors);
    for (const spec of roomPlanes(room)) {
      const { mesh } = planes[spec.id];
      const { width, height } = mesh.geometry.parameters;
      const position = mesh.geometry.getAttribute('position');
      const uv = mesh.geometry.getAttribute('uv');
      const color = mesh.geometry.getAttribute('color');
      expect(mesh.material.vertexColors).toBe(true);
      expect(color.itemSize).toBe(3);
      expect(color.count).toBe(16);
      for (let vertex = 0; vertex < 16; vertex++) {
        expect(uv.getX(vertex)).toBeCloseTo(
          (position.getX(vertex) + width / 2) / width,
        );
        expect(uv.getY(vertex)).toBeCloseTo(
          (position.getY(vertex) + height / 2) / height,
        );
      }
      expect(position.getY(0)).toBeCloseTo(height / 2);
      expect(position.getX(0)).toBeCloseTo(-width / 2);
      const { xs, ys, factors } = planeShading(spec);
      expect(position.getX(5)).toBeCloseTo(xs[1]);
      expect(position.getY(5)).toBeCloseTo(ys[2]);
      expect(color.getX(5)).toBeCloseTo(factors[2 * 4 + 1]);
      expect(color.getX(0)).toBeCloseTo(factors[3 * 4]);
    }
  });

  it('keeps only the four outer edges and the shading after a rebuild', () => {
    const roomMesh = createRoomMesh(room, colors);
    rebuildRoomMesh(roomMesh, { lengthM: 4, widthM: 4, heightM: 3 });
    for (const id of planeIds) {
      const { mesh, edges } = roomMesh.planes[id];
      expect(edges.geometry.getAttribute('position').count).toBe(8);
      expect(mesh.geometry.getAttribute('color').count).toBe(16);
      expect(mesh.geometry.getAttribute('uv').count).toBe(16);
    }
  });

  it('softens contours over planes with a material', () => {
    const roomMesh = createRoomMesh(room, colors);
    const { edges } = roomMesh.planes.floor;
    expect(edges.material.transparent).toBe(true);
    expect(edges.material.opacity).toBe(1);
    setRoomMeshSurface(
      roomMesh,
      'floor',
      { kind: 'color', productId: 'c', name: 'C', color: '#112233' },
      colors,
    );
    expect(edges.material.opacity).toBeLessThan(1);
    setRoomMeshSurface(
      roomMesh,
      'floor',
      { kind: 'neutral', reason: 'unselected' },
      colors,
    );
    expect(edges.material.opacity).toBe(1);
    setRoomMeshTexture(
      roomMesh,
      'floor',
      new Texture(),
      { widthMm: 300, lengthMm: 600 },
      room,
    );
    expect(edges.material.opacity).toBeLessThan(1);
  });
});

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

  it('keeps non-neutral planes when the neutral colour changes', () => {
    const roomMesh = createRoomMesh(room, colors);
    setRoomMeshSurface(
      roomMesh,
      'floor',
      { kind: 'color', productId: 'c', name: 'C', color: '#112233' },
      colors,
    );
    setRoomMeshSurface(
      roomMesh,
      'walls',
      { kind: 'color', productId: 'n', name: 'N', color: null },
      colors,
    );
    setRoomMeshColors(roomMesh, { ...colors, neutral: '#ff0000' });
    expect(roomMesh.planes.floor.mesh.material.color.getHexString()).toBe(
      '112233',
    );
    expect(roomMesh.planes.wallLeft.mesh.material.color.getHexString()).toBe(
      'ff0000',
    );
    expect(roomMesh.planes.ceiling.mesh.material.color.getHexString()).toBe(
      'ff0000',
    );
  });

  it.each([null, ''])(
    'refreshes a surface with a %j colour when the neutral colour changes',
    (color) => {
      const roomMesh = createRoomMesh(room, colors);
      setRoomMeshSurface(
        roomMesh,
        'floor',
        { kind: 'color', productId: 'c', name: 'C', color },
        colors,
      );
      setRoomMeshSurface(
        roomMesh,
        'walls',
        {
          kind: 'texture',
          productId: 't',
          name: 'T',
          color: '',
          textureUrl: 'u',
          previewUrl: null,
          textureStepMm: { widthMm: 1000, lengthMm: 1000 },
        },
        colors,
      );
      setRoomMeshColors(roomMesh, { ...colors, neutral: '#ff0000' });
      expect(roomMesh.planes.floor.mesh.material.color.getHexString()).toBe(
        'ff0000',
      );
      expect(roomMesh.planes.wallBack.mesh.material.color.getHexString()).toBe(
        'ff0000',
      );
    },
  );

  it('maps a texture clone per plane of the surface and rescales it on rebuild', () => {
    const roomMesh = createRoomMesh(room, colors);
    const texture = new Texture();
    const step = { widthMm: 1000, lengthMm: 1000 };
    setRoomMeshTexture(roomMesh, 'walls', texture, step, room);
    const { wallBack, wallLeft, floor } = roomMesh.planes;
    expect(wallBack.mesh.material.map).not.toBe(wallLeft.mesh.material.map);
    expect(wallBack.mesh.material.map).not.toBe(texture);
    expect(wallBack.mesh.material.map?.repeat.toArray()).toEqual([5, 2.7]);
    expect(floor.mesh.material.map).toBeNull();
    rebuildRoomMesh(roomMesh, { lengthM: 8, widthM: 4, heightM: 3 });
    expect(wallBack.mesh.material.map?.repeat.toArray()).toEqual([8, 3]);
  });

  it('drops the clone and the map when the surface is repainted', () => {
    const roomMesh = createRoomMesh(room, colors);
    setRoomMeshTexture(
      roomMesh,
      'floor',
      new Texture(),
      { widthMm: 1000, lengthMm: 1000 },
      room,
    );
    const clone = roomMesh.planes.floor.mesh.material.map as Texture;
    let disposed = 0;
    clone.addEventListener('dispose', () => {
      disposed += 1;
    });
    setRoomMeshSurface(
      roomMesh,
      'floor',
      { kind: 'neutral', reason: 'unselected' },
      colors,
    );
    expect(roomMesh.planes.floor.mesh.material.map).toBeNull();
    expect(disposed).toBe(1);
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
