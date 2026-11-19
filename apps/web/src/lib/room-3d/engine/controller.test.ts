import {
  type BufferGeometry,
  type Camera,
  type LineBasicMaterial,
  type LineSegments,
  type Mesh,
  type MeshBasicMaterial,
  type Object3D,
  type PlaneGeometry,
  type Scene,
  Texture,
} from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cameraLimits,
  cameraPosition,
  cameraTarget,
  defaultView,
} from '../camera';
import { type PlaneId, textureRepeat } from '../geometry';
import type {
  RoomSceneInput,
  SceneColors,
  SceneMaterial,
  SceneStatus,
} from '../types';
import {
  createRoomSceneController,
  type DimensionLabel,
  type RoomSceneController,
} from './controller';

const mocks = vi.hoisted(() => ({
  render: vi.fn(),
  forceContextLoss: vi.fn(),
  created: 0,
  fail: false,
  request: vi.fn(),
  release: vi.fn(),
  disposeCache: vi.fn(),
  anisotropy: undefined as number | undefined,
  setPixelRatio: vi.fn(),
  options: undefined as { antialias?: boolean } | undefined,
}));

vi.mock('./texture-cache', () => ({
  createTextureCache: (options: { anisotropy: number }) => {
    mocks.anisotropy = options.anisotropy;
    return {
      request: mocks.request,
      release: mocks.release,
      dispose: mocks.disposeCache,
    };
  },
}));

vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal<typeof import('three')>();
  class WebGLRenderer {
    domElement = document.createElement('canvas');
    constructor(options?: { antialias?: boolean }) {
      mocks.options = options;
      if (mocks.fail) throw new Error('no webgl');
      mocks.created += 1;
    }
    setSize = vi.fn();
    setPixelRatio = mocks.setPixelRatio;
    getPixelRatio = () => 2;
    capabilities = { getMaxAnisotropy: () => 8 };
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

const floorTexture: SceneMaterial = {
  kind: 'texture',
  productId: 'tile',
  name: 'Tile',
  color: '#aa8866',
  textureUrl: 'https://cdn/tile.jpg',
  previewUrl: 'https://cdn/tile-small.jpg',
  textureStepMm: { widthMm: 1500, lengthMm: 1500 },
};

function withFloor(floor: SceneMaterial, base = input): RoomSceneInput {
  return { ...base, surfaces: { ...base.surfaces, floor } };
}

function planeMaterial(id: PlaneId): MeshBasicMaterial {
  return (find(lastFrame().scene, id) as Mesh<PlaneGeometry, MeshBasicMaterial>)
    .material;
}

function deliver(call = 0) {
  const texture = new Texture();
  mocks.request.mock.calls[call][2](texture);
  return texture;
}

beforeEach(() => {
  mocks.render.mockClear();
  mocks.forceContextLoss.mockClear();
  mocks.created = 0;
  mocks.fail = false;
  mocks.request.mockReset();
  mocks.release.mockClear();
  mocks.disposeCache.mockClear();
  mocks.anisotropy = undefined;
  mocks.setPixelRatio.mockClear();
  mocks.options = undefined;
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

  it.each([
    [1, 1, true],
    [2, 2, false],
    [3, 2, false],
  ])(
    'at device pixel ratio %s sets pixel ratio %s and antialias %s',
    (dpr, ratio, antialias) => {
      vi.stubGlobal('devicePixelRatio', dpr);
      create();
      expect(mocks.setPixelRatio).toHaveBeenCalledWith(ratio);
      expect(mocks.options?.antialias).toBe(antialias);
      vi.unstubAllGlobals();
    },
  );

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

  it('refits the target of a running transition to a new aspect', () => {
    vi.useFakeTimers();
    create(false);
    controller.setInput(input);
    press('ArrowRight', 3);
    controller.resetView();
    vi.advanceTimersByTime(100);
    controller.resize(200, 540);
    vi.advanceTimersByTime(600);
    const [x, y, z] = cameraTarget(input);
    const distance = lastFrame().camera.position.distanceTo({ x, y, z });
    expect(distance).toBeCloseTo(defaultView(input, 200 / 540).distance, 3);
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

  describe('context loss', () => {
    function lose() {
      const event = new Event('webglcontextlost', { cancelable: true });
      container.querySelector('canvas')?.dispatchEvent(event);
      return event;
    }

    function restore() {
      container
        .querySelector('canvas')
        ?.dispatchEvent(new Event('webglcontextrestored'));
    }

    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('prevents the default and stops rendering while the context is lost', () => {
      create();
      controller.setInput(input);
      const event = lose();
      expect(event.defaultPrevented).toBe(true);
      const before = mocks.render.mock.calls.length;
      controller.setColors({ ...colors, neutral: '#000000' });
      controller.resize(400, 300);
      expect(mocks.render).toHaveBeenCalledTimes(before);
    });

    it('renders once on restore without rebuilding the textures', () => {
      create();
      controller.setInput(input);
      lose();
      const before = mocks.render.mock.calls.length;
      const disposed = mocks.disposeCache.mock.calls.length;
      restore();
      expect(mocks.disposeCache).toHaveBeenCalledTimes(disposed);
      expect(mocks.render).toHaveBeenCalledTimes(before + 1);
      expect(statuses).toEqual(['ready', 'loading', 'ready']);
      vi.advanceTimersByTime(5000);
      expect(statuses).toEqual(['ready', 'loading', 'ready']);
    });

    it('reports loading while waiting for the context to be restored', () => {
      create();
      controller.setInput(input);
      lose();
      expect(statuses).toEqual(['ready', 'loading']);
    });

    it('ignores keys while the context is lost', () => {
      create();
      controller.setInput(input);
      lose();
      expect(controller.handleKey('ArrowLeft')).toBe(false);
      restore();
      expect(controller.handleKey('ArrowLeft')).toBe(true);
    });

    it('does not request the textures again after a restore', () => {
      create();
      controller.setInput(withFloor(floorTexture));
      const requested = mocks.request.mock.calls.length;
      lose();
      restore();
      expect(mocks.request.mock.calls.length).toBe(requested);
    });

    it('reports lost when the context is not restored within 3 s', () => {
      create();
      controller.setInput(input);
      lose();
      vi.advanceTimersByTime(2999);
      expect(statuses).toEqual(['ready', 'loading']);
      vi.advanceTimersByTime(1);
      expect(statuses).toEqual(['ready', 'loading', 'lost']);
    });

    it('reports lost at once when the context is lost a second time', () => {
      create();
      controller.setInput(input);
      lose();
      restore();
      lose();
      expect(statuses).toEqual(['ready', 'loading', 'ready', 'lost']);
    });

    it('does not start the timer when the context is lost while inactive', () => {
      create();
      controller.setInput(input);
      controller.setActive(false);
      lose();
      vi.advanceTimersByTime(5000);
      expect(statuses).toEqual(['ready']);
    });

    it('does not count losses that happen while inactive', () => {
      create();
      controller.setInput(input);
      controller.setActive(false);
      lose();
      restore();
      controller.setActive(true);
      lose();
      expect(statuses).toEqual(['ready', 'ready', 'loading']);
      vi.advanceTimersByTime(2999);
      expect(statuses).toEqual(['ready', 'ready', 'loading']);
    });

    it('reports a loss that happened while inactive once reactivated', () => {
      create();
      controller.setInput(input);
      controller.setActive(false);
      lose();
      controller.setActive(true);
      expect(statuses).toEqual(['ready', 'loading']);
      vi.advanceTimersByTime(3000);
      expect(statuses).toEqual(['ready', 'loading', 'lost']);
    });

    it('clears the timer when deactivated while lost', () => {
      create();
      controller.setInput(input);
      lose();
      controller.setActive(false);
      vi.advanceTimersByTime(5000);
      expect(statuses).toEqual(['ready', 'loading']);
    });

    it('starts a fresh timer when reactivated while still lost', () => {
      create();
      controller.setInput(input);
      lose();
      vi.advanceTimersByTime(2000);
      controller.setActive(false);
      controller.setActive(true);
      vi.advanceTimersByTime(2999);
      expect(statuses).toEqual(['ready', 'loading']);
      vi.advanceTimersByTime(1);
      expect(statuses).toEqual(['ready', 'loading', 'lost']);
    });

    it('drops the listeners and the timer on dispose', () => {
      create();
      controller.setInput(input);
      lose();
      controller.dispose();
      vi.advanceTimersByTime(5000);
      expect(statuses).toEqual(['ready', 'loading']);
    });
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

  describe('materials', () => {
    it('keeps the camera while a material is swapped', () => {
      create();
      controller.setInput(input);
      press('ArrowRight', 2);
      const before = lastFrame().camera.position.clone();
      controller.setInput(withFloor(floorTexture));
      deliver();
      controller.setInput(
        withFloor({
          kind: 'color',
          productId: 'c',
          name: 'C',
          color: '#112233',
        }),
      );
      expect(lastFrame().camera.position.toArray()).toEqual(before.toArray());
    });

    it('creates the cache with the renderer anisotropy and requests a url for the canvas', () => {
      create();
      controller.setInput(withFloor(floorTexture));
      expect(mocks.anisotropy).toBe(8);
      expect(mocks.request).toHaveBeenCalledWith(
        'floor',
        'https://cdn/tile.jpg',
        expect.any(Function),
        expect.any(Function),
      );
    });

    it('re-picks the preview and the full texture when the canvas resizes', () => {
      create();
      controller.resize(300, 200);
      controller.setInput(withFloor(floorTexture));
      expect(mocks.request.mock.calls.at(-1)?.[1]).toBe(
        'https://cdn/tile-small.jpg',
      );
      controller.resize(800, 600);
      expect(mocks.request).toHaveBeenCalledTimes(2);
      expect(mocks.request.mock.calls.at(-1)?.[1]).toBe('https://cdn/tile.jpg');
      controller.resize(801, 600);
      expect(mocks.request).toHaveBeenCalledTimes(2);
    });

    it('does not retry a failed texture on an unrelated input change', () => {
      create();
      controller.setInput(withFloor(floorTexture));
      mocks.request.mock.calls[0][3]();
      controller.setInput(withFloor(floorTexture));
      controller.setInput({
        ...withFloor(floorTexture),
        surfaces: {
          ...withFloor(floorTexture).surfaces,
          walls: {
            ...floorTexture,
            productId: 'w',
            textureUrl: 'https://cdn/w.jpg',
          },
        },
      });
      expect(
        mocks.request.mock.calls.filter(([slot]) => slot === 'floor'),
      ).toHaveLength(1);
    });

    it('retries a failed texture when the room key changes', () => {
      create();
      controller.setInput(withFloor(floorTexture));
      mocks.request.mock.calls[0][3]();
      controller.setInput(withFloor(floorTexture, { ...input, roomKey: 'b' }));
      expect(
        mocks.request.mock.calls.filter(([slot]) => slot === 'floor'),
      ).toHaveLength(2);
    });

    it('does not retry a failed texture on resize', () => {
      create();
      controller.setInput(withFloor(floorTexture));
      mocks.request.mock.calls[0][3]();
      controller.resize(801, 600);
      controller.resize(802, 600);
      expect(mocks.request).toHaveBeenCalledTimes(1);
    });

    it('keeps the shown texture while another resolution loads', () => {
      create();
      controller.resize(300, 200);
      controller.setInput(withFloor(floorTexture));
      const preview = deliver();
      controller.resize(800, 600);
      expect(mocks.request).toHaveBeenCalledTimes(2);
      expect(planeMaterial('floor').map?.source).toBe(preview.source);
      expect(planeMaterial('floor').color.getHexString()).toBe('ffffff');
      const full = deliver(1);
      expect(planeMaterial('floor').map?.source).toBe(full.source);
    });

    it('renders once when the room size and a material change together', () => {
      create();
      controller.setInput(input);
      mocks.render.mockClear();
      controller.setInput(withFloor(floorTexture, { ...input, lengthM: 4 }));
      expect(mocks.render).toHaveBeenCalledTimes(1);
      expect(planeMaterial('floor').color.getHexString()).toBe('aa8866');
    });

    it('renders once per input when cached textures are ready at once', () => {
      create();
      controller.setInput(input);
      mocks.request.mockImplementation(
        (_slot: string, _url: string, onReady: (t: Texture) => void) =>
          onReady(new Texture()),
      );
      mocks.render.mockClear();
      controller.setInput({
        ...input,
        surfaces: {
          floor: floorTexture,
          walls: { ...floorTexture, productId: 'w' },
          ceiling: { ...floorTexture, productId: 'c' },
        },
      });
      expect(mocks.request).toHaveBeenCalledTimes(3);
      expect(mocks.render).toHaveBeenCalledTimes(1);
    });

    it('shows the fallback colour first, then the map with a white tint', () => {
      create();
      controller.setInput(withFloor(floorTexture));
      expect(planeMaterial('floor').color.getHexString()).toBe('aa8866');
      expect(planeMaterial('floor').map).toBeNull();
      deliver();
      expect(planeMaterial('floor').map).not.toBeNull();
      expect(planeMaterial('floor').color.getHexString()).toBe('ffffff');
    });

    it('sets the repeat from the real size step and from a module step', () => {
      const room = { lengthM: 3, widthM: 3, heightM: 2.7 };
      create();
      controller.setInput(withFloor(floorTexture, { ...input, ...room }));
      deliver();
      expect(planeMaterial('floor').map?.repeat.toArray()).toEqual([2, 2]);

      const step = { widthMm: 190, lengthMm: 1200 };
      controller.setInput(
        withFloor(
          { ...floorTexture, productId: 'plank', textureStepMm: step },
          { ...input, ...room },
        ),
      );
      deliver(1);
      expect(planeMaterial('floor').map?.repeat.toArray()).toEqual(
        textureRepeat('floor', room, step),
      );
    });

    it('paints all four walls with the walls material', () => {
      create();
      controller.setInput({
        ...input,
        surfaces: { ...input.surfaces, walls: floorTexture },
      });
      deliver();
      for (const id of [
        'wallBack',
        'wallFront',
        'wallLeft',
        'wallRight',
      ] as const) {
        expect(planeMaterial(id).map).not.toBeNull();
      }
      expect(planeMaterial('floor').map).toBeNull();
    });

    it('changes only neutral planes, edges and background on setColors', () => {
      create();
      controller.setInput({
        ...input,
        surfaces: {
          floor: { kind: 'color', productId: 'c', name: 'C', color: '#112233' },
          walls: { kind: 'color', productId: 'n', name: 'N', color: null },
          ceiling: floorTexture,
        },
      });
      controller.setColors({ ...colors, neutral: '#ff0000', edge: '#00ff00' });
      expect(planeMaterial('floor').color.getHexString()).toBe('112233');
      expect(planeMaterial('wallBack').color.getHexString()).toBe('ff0000');
      expect(planeMaterial('ceiling').color.getHexString()).toBe('aa8866');
      const edges = find(lastFrame().scene, 'floor-edges') as Mesh<
        PlaneGeometry,
        MeshBasicMaterial
      >;
      expect(edges.material.color.getHexString()).toBe('00ff00');
    });

    it('clears the map and disposes the clone when a texture becomes neutral', () => {
      create();
      controller.setInput(withFloor(floorTexture));
      deliver();
      const clone = planeMaterial('floor').map as Texture;
      const disposed = vi.fn();
      clone.addEventListener('dispose', disposed);
      controller.setInput(input);
      expect(planeMaterial('floor').map).toBeNull();
      expect(planeMaterial('floor').color.getHexString()).toBe('cccccc');
      expect(disposed).toHaveBeenCalledTimes(1);
      expect(mocks.release).toHaveBeenCalledWith('floor');
    });

    it('recomputes the repeat when the room is resized', () => {
      create();
      controller.setInput(withFloor(floorTexture, { ...input, lengthM: 3 }));
      deliver();
      const resized = { ...input, lengthM: 6 };
      controller.setInput(withFloor(floorTexture, resized));
      expect(planeMaterial('floor').map?.repeat.toArray()).toEqual(
        textureRepeat('floor', resized, floorTexture.textureStepMm),
      );
    });

    it('applies materials that arrived before mount', () => {
      controller = createRoomSceneController({ reducedMotion: true });
      controller.setInput(withFloor(floorTexture));
      controller.resize(800, 600);
      controller.mount(container);
      expect(mocks.request).toHaveBeenCalledTimes(1);
      expect(planeMaterial('floor').color.getHexString()).toBe('aa8866');
    });

    it('disposes the cache and clones and ignores late textures', () => {
      create();
      controller.setInput(withFloor(floorTexture));
      deliver();
      const clone = planeMaterial('floor').map as Texture;
      const disposed = vi.fn();
      clone.addEventListener('dispose', disposed);
      controller.setInput(withFloor({ ...floorTexture, productId: 'other' }));
      const renders = mocks.render.mock.calls.length;
      controller.dispose();
      expect(mocks.disposeCache).toHaveBeenCalledTimes(1);
      expect(disposed).toHaveBeenCalled();
      expect(() => deliver(1)).not.toThrow();
      expect(mocks.render.mock.calls.length).toBe(renders);
    });
  });
});

describe('dimension labels', () => {
  function createWithLabels(onLabels: (labels: DimensionLabel[]) => void) {
    controller = createRoomSceneController({
      reducedMotion: true,
      onDimensionLabels: onLabels,
    });
    controller.setColors(colors);
    controller.resize(800, 600);
    controller.mount(container);
  }

  function dimensionObject() {
    return find(lastFrame().scene, 'dimension-lines') as LineSegments<
      BufferGeometry,
      LineBasicMaterial
    >;
  }

  it('reports length, width and height labels in canvas pixels', () => {
    const onLabels = vi.fn();
    createWithLabels(onLabels);
    controller.setInput(input);
    const labels = onLabels.mock.calls.at(-1)?.[0] as DimensionLabel[];
    expect(labels.map(({ key }) => key).sort()).toEqual([
      'height',
      'length',
      'width',
    ]);
    for (const { x, y } of labels) {
      expect(Number.isFinite(x)).toBe(true);
      expect(Number.isFinite(y)).toBe(true);
      expect(x).toBeGreaterThan(-100);
      expect(x).toBeLessThan(900);
      expect(y).toBeGreaterThan(-100);
      expect(y).toBeLessThan(700);
    }
  });

  it('drops the height label from the top view', () => {
    const onLabels = vi.fn();
    createWithLabels(onLabels);
    controller.setInput(input);
    controller.topView();
    const labels = onLabels.mock.calls.at(-1)?.[0] as DimensionLabel[];
    expect(labels.map(({ key }) => key)).not.toContain('height');
    expect(labels.map(({ key }) => key)).toContain('length');
  });

  it('does not report labels while inactive', () => {
    const onLabels = vi.fn();
    createWithLabels(onLabels);
    controller.setInput(input);
    controller.setActive(false);
    onLabels.mockClear();
    controller.setColors({ ...colors, edge: '#445566' });
    controller.topView();
    expect(onLabels).not.toHaveBeenCalled();
  });

  it('recolours the lines with the edge colour', () => {
    createWithLabels(vi.fn());
    controller.setInput(input);
    controller.setColors({ ...colors, edge: '#ff0000' });
    expect(dimensionObject().material.color.getHexString()).toBe('ff0000');
  });

  it('disposes the lines with the controller', () => {
    createWithLabels(vi.fn());
    controller.setInput(input);
    const { geometry, material } = dimensionObject();
    const disposeGeometry = vi.spyOn(geometry, 'dispose');
    const disposeMaterial = vi.spyOn(material, 'dispose');
    controller.dispose();
    expect(disposeGeometry).toHaveBeenCalled();
    expect(disposeMaterial).toHaveBeenCalled();
    expect(
      lastFrame().scene.getObjectByName('dimension-lines'),
    ).toBeUndefined();
  });
});
