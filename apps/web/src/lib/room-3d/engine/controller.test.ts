import type { Camera, Mesh, Object3D, PlaneGeometry, Scene } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cameraLimits,
  cameraPosition,
  cameraTarget,
  defaultView,
} from '../camera';
import type { PlaneId } from '../geometry';
import type { RoomSceneInput, SceneColors, SceneStatus } from '../types';
import {
  createRoomSceneController,
  type RoomSceneController,
} from './controller';

const mocks = vi.hoisted(() => ({
  render: vi.fn(),
  forceContextLoss: vi.fn(),
  created: 0,
  fail: false,
}));

vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal<typeof import('three')>();
  class WebGLRenderer {
    domElement = document.createElement('canvas');
    constructor() {
      if (mocks.fail) throw new Error('no webgl');
      mocks.created += 1;
    }
    setSize = vi.fn();
    setPixelRatio = vi.fn();
    setClearColor = vi.fn();
    render = mocks.render;
    dispose = vi.fn();
    forceContextLoss = mocks.forceContextLoss;
  }
  return { ...actual, WebGLRenderer };
});

const colors: SceneColors = {
  background: '#ffffff',
  neutral: '#cccccc',
  edge: '#222222',
};
const input: RoomSceneInput = {
  roomKey: 'a',
  lengthM: 5,
  widthM: 3,
  heightM: 2.7,
  surfaces: {
    floor: { kind: 'neutral', reason: 'unselected' },
    walls: { kind: 'neutral', reason: 'unselected' },
    ceiling: { kind: 'neutral', reason: 'unselected' },
  },
};
const tallInput: RoomSceneInput = {
  ...input,
  roomKey: 'tall',
  lengthM: 3,
  widthM: 3,
  heightM: 10,
};

let container: HTMLElement;
let controller: RoomSceneController;
let statuses: SceneStatus[];

function create(reducedMotion = true) {
  controller = createRoomSceneController({
    reducedMotion,
    onStatus: (status) => statuses.push(status),
  });
  controller.setColors(colors);
  controller.resize(800, 600);
  controller.mount(container);
}

function press(key: string, times = 1) {
  for (let i = 0; i < times; i += 1) controller.handleKey(key);
}

function lastFrame(): { scene: Scene; camera: Camera } {
  const [scene, camera] = mocks.render.mock.calls.at(-1) as [Scene, Camera];
  return { scene, camera };
}

function find(scene: Scene, name: string): Object3D {
  const found = scene.getObjectByName(name);
  if (!found) throw new Error(`missing ${name}`);
  return found;
}

function planeSize(scene: Scene, id: PlaneId) {
  const { parameters } = (find(scene, id) as Mesh<PlaneGeometry>).geometry;
  return [parameters.width, parameters.height];
}

function polarAndDistance(room: RoomSceneInput) {
  const { position } = lastFrame().camera;
  const [x, y, z] = cameraTarget(room);
  const dx = position.x - x;
  const dy = position.y - y;
  const dz = position.z - z;
  return {
    distance: Math.hypot(dx, dy, dz),
    polar: Math.atan2(Math.hypot(dx, dz), dy),
  };
}

beforeEach(() => {
  mocks.render.mockClear();
  mocks.forceContextLoss.mockClear();
  mocks.created = 0;
  mocks.fail = false;
  statuses = [];
  container = document.createElement('div');
  document.body.append(container);
});

afterEach(() => {
  controller.dispose();
  container.remove();
  vi.useRealTimers();
});

describe('room scene controller', () => {
  it('mounts one canvas and reports ready', () => {
    create();
    controller.setInput(input);
    expect(container.querySelectorAll('canvas')).toHaveLength(1);
    expect(statuses).toEqual(['ready']);
  });

  it('reports an error when the renderer cannot be created', () => {
    mocks.fail = true;
    create();
    expect(statuses).toEqual(['error']);
    expect(container.querySelector('canvas')).toBeNull();
    expect(() => controller.setInput(input)).not.toThrow();
  });

  it('builds floor, four walls and ceiling from the room size', () => {
    create();
    controller.setInput(input);
    const { scene } = lastFrame();
    expect(planeSize(scene, 'floor')).toEqual([5, 3]);
    expect(planeSize(scene, 'ceiling')).toEqual([5, 3]);
    expect(planeSize(scene, 'wallBack')).toEqual([5, 2.7]);
    expect(planeSize(scene, 'wallLeft')).toEqual([3, 2.7]);
  });

  it('rebuilds for a new size without a new renderer or canvas', () => {
    create();
    controller.setInput(input);
    const canvas = container.querySelector('canvas');
    controller.setInput({ ...input, lengthM: 8, widthM: 4 });
    expect(mocks.created).toBe(1);
    expect(container.querySelector('canvas')).toBe(canvas);
    expect(planeSize(lastFrame().scene, 'floor')).toEqual([8, 4]);
  });

  it('keeps the view while the room key stays and resets it when it changes', () => {
    create();
    controller.setInput(input);
    const start = lastFrame().camera.position.clone();
    press('ArrowRight', 2);
    press('ArrowDown', 2);
    expect(lastFrame().camera.position.distanceTo(start)).toBeGreaterThan(0.1);

    controller.setInput({ ...input, lengthM: 6 });
    expect(lastFrame().camera.position.distanceTo(start)).toBeGreaterThan(0.1);

    const next = { ...input, roomKey: 'b' };
    controller.setInput(next);
    const expected = cameraPosition(defaultView(next, 800 / 600), next);
    lastFrame()
      .camera.position.toArray()
      .forEach((value, axis) => {
        expect(value).toBeCloseTo(expected[axis], 4);
      });
  });

  it('keeps the camera within the distance and polar limits', () => {
    create();
    controller.setInput(input);
    const limits = cameraLimits(input, 800 / 600);

    press('-', 50);
    expect(polarAndDistance(input).distance).toBeCloseTo(limits.maxDistance, 3);
    press('+', 50);
    expect(polarAndDistance(input).distance).toBeCloseTo(limits.minDistance, 3);
    press('ArrowDown', 50);
    expect(polarAndDistance(input).polar).toBeCloseTo(limits.maxPolar, 3);
    press('ArrowUp', 50);
    expect(polarAndDistance(input).polar).toBeCloseTo(limits.minPolar, 3);
  });

  it('renders on demand and stays idle otherwise', () => {
    vi.useFakeTimers();
    create();
    controller.setInput(input);
    const canvas = container.querySelector('canvas') as HTMLCanvasElement;
    const idle = mocks.render.mock.calls.length;
    vi.advanceTimersByTime(5000);
    expect(mocks.render).toHaveBeenCalledTimes(idle);

    canvas.dispatchEvent(new WheelEvent('wheel', { deltaY: 200 }));
    expect(mocks.render.mock.calls.length).toBeGreaterThan(idle);

    const afterChange = mocks.render.mock.calls.length;
    vi.advanceTimersByTime(5000);
    expect(mocks.render).toHaveBeenCalledTimes(afterChange);
  });

  it('ignores a repeated input for the same room and size', () => {
    vi.useFakeTimers();
    create(false);
    controller.setInput(input);
    const start = lastFrame().camera.position.clone();
    press('ArrowRight', 3);
    controller.resetView();
    vi.advanceTimersByTime(100);
    const before = mocks.render.mock.calls.length;
    controller.setInput({ ...input, surfaces: { ...input.surfaces } });
    expect(mocks.render).toHaveBeenCalledTimes(before);
    vi.advanceTimersByTime(400);
    expect(lastFrame().camera.position.distanceTo(start)).toBeCloseTo(0, 3);
  });

  it('refits the room into a narrower frame after a resize', () => {
    create();
    controller.setInput(input);
    controller.resize(200, 540);
    const [x, y, z] = cameraTarget(input);
    const distance = lastFrame().camera.position.distanceTo({ x, y, z });
    expect(distance).toBeCloseTo(defaultView(input, 200 / 540).distance, 3);
  });

  it('renders on colour changes and resizes, and not while inactive', () => {
    create();
    controller.setInput(input);
    const before = mocks.render.mock.calls.length;
    controller.setColors({ ...colors, neutral: '#000000' });
    controller.resize(400, 300);
    expect(mocks.render.mock.calls.length).toBe(before + 2);

    controller.setActive(false);
    const paused = mocks.render.mock.calls.length;
    controller.setColors(colors);
    expect(controller.handleKey('ArrowLeft')).toBe(false);
    expect(mocks.render).toHaveBeenCalledTimes(paused);
    controller.setActive(true);
    expect(mocks.render).toHaveBeenCalledTimes(paused + 1);
  });

  it('does not render when the colours are unchanged', () => {
    create();
    controller.setInput(input);
    const before = mocks.render.mock.calls.length;
    controller.setColors({ ...colors });
    expect(mocks.render).toHaveBeenCalledTimes(before);
  });

  it('hides the ceiling from the default view and shows it from a low one', () => {
    create();
    controller.setInput(tallInput);
    const ceiling = () => find(lastFrame().scene, 'ceiling-edges').visible;
    const floor = () => find(lastFrame().scene, 'floor-edges').visible;
    expect(ceiling()).toBe(false);
    expect(floor()).toBe(true);
    press('ArrowDown', 50);
    expect(ceiling()).toBe(true);
  });

  it('jumps to the default and top views at once when motion is reduced', () => {
    create(true);
    controller.setInput(input);
    const start = lastFrame().camera.position.clone();
    press('ArrowRight', 3);
    press('ArrowDown', 2);
    controller.resetView();
    expect(lastFrame().camera.position.distanceTo(start)).toBeCloseTo(0, 3);
    controller.topView();
    const { position } = lastFrame().camera;
    expect(Math.hypot(position.x, position.z)).toBeLessThan(position.y);
  });

  it('eases to the default view over 300 ms when motion is allowed', () => {
    vi.useFakeTimers();
    create(false);
    controller.setInput(input);
    const start = lastFrame().camera.position.clone();
    press('ArrowRight', 3);
    press('ArrowDown', 2);
    controller.resetView();
    const turned = lastFrame().camera.position.distanceTo(start);
    expect(turned).toBeGreaterThan(0.1);
    vi.advanceTimersByTime(150);
    const mid = lastFrame().camera.position.distanceTo(start);
    expect(mid).toBeGreaterThan(0.01);
    expect(mid).toBeLessThan(turned);
    vi.advanceTimersByTime(300);
    expect(lastFrame().camera.position.distanceTo(start)).toBeCloseTo(0, 3);
  });

  it('lets a running transition finish when the canvas is resized', () => {
    vi.useFakeTimers();
    create(false);
    controller.setInput(input);
    const start = lastFrame().camera.position.clone();
    press('ArrowRight', 3);
    press('ArrowDown', 2);
    controller.resetView();
    vi.advanceTimersByTime(100);
    controller.resize(640, 480);
    vi.advanceTimersByTime(400);
    expect(lastFrame().camera.position.distanceTo(start)).toBeCloseTo(0, 3);
  });

  it('handles known keys and ignores unknown ones without rendering', () => {
    create();
    controller.setInput(input);
    for (const key of [
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      '+',
      '=',
      '-',
      '−',
    ]) {
      expect(controller.handleKey(key)).toBe(true);
    }
    const before = mocks.render.mock.calls.length;
    expect(controller.handleKey('a')).toBe(false);
    expect(controller.handleKey('Enter')).toBe(false);
    expect(mocks.render).toHaveBeenCalledTimes(before);
  });

  it('removes the canvas on dispose', () => {
    create();
    controller.setInput(input);
    controller.dispose();
    expect(container.querySelector('canvas')).toBeNull();
  });

  it('releases the WebGL context on dispose', () => {
    create();
    controller.dispose();
    expect(mocks.forceContextLoss).toHaveBeenCalledTimes(1);
  });
});
