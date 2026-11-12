import { PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  cameraLimits,
  cameraPosition,
  cameraTarget,
  clampView,
  defaultView,
  fovDegrees,
  stepView,
  topView as toTopView,
  visibleFaces,
} from '../camera';
import type { RoomSize } from '../geometry';
import type {
  CameraView,
  RoomSceneInput,
  SceneColors,
  SceneStatus,
} from '../types';
import {
  createRoomMesh,
  disposeRoomMesh,
  type RoomMesh,
  rebuildRoomMesh,
  setRoomMeshColors,
  setRoomMeshEdges,
} from './room-mesh';

export type RoomSceneControllerOptions = {
  reducedMotion: boolean;
  onStatus?: (status: SceneStatus) => void;
};

export type RoomSceneController = {
  mount(container: HTMLElement): void;
  setInput(input: RoomSceneInput): void;
  setColors(colors: SceneColors): void;
  resize(width: number, height: number): void;
  resetView(): void;
  topView(): void;
  handleKey(key: string): boolean;
  setActive(active: boolean): void;
  setReducedMotion(reduced: boolean): void;
  dispose(): void;
};

const transitionMs = 300;
const turn = Math.PI * 2;

const initialColors: SceneColors = {
  background: '#ffffff',
  neutral: '#cccccc',
  edge: '#333333',
};

function roomSize({ lengthM, widthM, heightM }: RoomSize): RoomSize {
  return { lengthM, widthM, heightM };
}

function sameSize(a: RoomSize, b: RoomSize): boolean {
  return (
    a.lengthM === b.lengthM && a.widthM === b.widthM && a.heightM === b.heightM
  );
}

function shortestTurn(from: number, to: number): number {
  return ((((to - from + Math.PI) % turn) + turn) % turn) - Math.PI;
}

function ease(t: number): number {
  return t * t * (3 - 2 * t);
}

export function createRoomSceneController({
  reducedMotion: initialReducedMotion,
  onStatus,
}: RoomSceneControllerOptions): RoomSceneController {
  const scene = new Scene();
  const camera = new PerspectiveCamera(fovDegrees, 1, 0.1, 100);
  let renderer: WebGLRenderer | null = null;
  let controls: OrbitControls | null = null;
  let roomMesh: RoomMesh | null = null;
  let input: RoomSceneInput | null = null;
  let builtRoom: RoomSize | null = null;
  let colors = initialColors;
  let size = { width: 1, height: 1 };
  let active = true;
  let reducedMotion = initialReducedMotion;
  let silent = false;
  let frame: number | null = null;

  const aspect = () => size.width / size.height;

  function render() {
    if (!renderer || !roomMesh || !input || !active) return;
    setRoomMeshEdges(roomMesh, visibleFaces(currentView(input), input));
    renderer.render(scene, camera);
  }

  function currentView(room: RoomSize): CameraView {
    const [x, y, z] = cameraTarget(room);
    const dx = camera.position.x - x;
    const dy = camera.position.y - y;
    const dz = camera.position.z - z;
    return {
      azimuth: Math.atan2(dx, dz),
      polar: Math.atan2(Math.hypot(dx, dz), dy),
      distance: Math.hypot(dx, dy, dz),
    };
  }

  function applyLimits(room: RoomSize) {
    if (!controls) return;
    const limits = cameraLimits(room, aspect());
    controls.minDistance = limits.minDistance;
    controls.maxDistance = limits.maxDistance;
    controls.minPolarAngle = limits.minPolar;
    controls.maxPolarAngle = limits.maxPolar;
    camera.near = limits.minDistance * 0.05;
    camera.far = limits.maxDistance * 2;
    camera.updateProjectionMatrix();
  }

  function applyView(view: CameraView, room: RoomSize) {
    if (!controls) return;
    camera.position.set(...cameraPosition(view, room));
    controls.target.set(...cameraTarget(room));
    silent = true;
    controls.update();
    silent = false;
  }

  function cancelTransition() {
    if (frame === null) return;
    cancelAnimationFrame(frame);
    frame = null;
  }

  function moveTo(view: CameraView, animate: boolean) {
    cancelTransition();
    if (!input) return;
    const room = roomSize(input);
    const target = clampView(view, cameraLimits(room, aspect()));
    if (!animate || reducedMotion || !active) {
      applyView(target, room);
      render();
      return;
    }
    const from = currentView(room);
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / transitionMs);
      const eased = ease(t);
      applyView(
        {
          azimuth:
            from.azimuth + shortestTurn(from.azimuth, target.azimuth) * eased,
          polar: from.polar + (target.polar - from.polar) * eased,
          distance: from.distance + (target.distance - from.distance) * eased,
        },
        room,
      );
      render();
      frame = t < 1 ? requestAnimationFrame(step) : null;
    };
    frame = requestAnimationFrame(step);
  }

  function build(room: RoomSize) {
    if (!roomMesh) {
      roomMesh = createRoomMesh(room, colors);
      scene.add(roomMesh.group);
    } else if (!builtRoom || !sameSize(builtRoom, room)) {
      rebuildRoomMesh(roomMesh, room);
    }
    builtRoom = room;
  }

  function sync(resetView: boolean) {
    if (!renderer || !input) return;
    const room = roomSize(input);
    build(room);
    applyLimits(room);
    const view = resetView ? defaultView(room, aspect()) : currentView(room);
    moveTo(view, false);
  }

  return {
    mount(container) {
      if (renderer) return;
      try {
        renderer = new WebGLRenderer({
          antialias: window.devicePixelRatio <= 1,
        });
      } catch {
        onStatus?.('error');
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(colors.background);
      if (container.clientWidth > 0 && container.clientHeight > 0) {
        size = { width: container.clientWidth, height: container.clientHeight };
      }
      renderer.setSize(size.width, size.height);
      camera.aspect = aspect();
      container.append(renderer.domElement);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enablePan = false;
      controls.enableDamping = false;
      controls.enabled = active;
      controls.addEventListener('start', cancelTransition);
      controls.addEventListener('change', () => {
        if (!silent) render();
      });

      sync(true);
      onStatus?.('ready');
    },
    setInput(next) {
      const keyChanged = !input || input.roomKey !== next.roomKey;
      input = next;
      sync(keyChanged);
    },
    setColors(next) {
      colors = next;
      if (!renderer) return;
      renderer.setClearColor(next.background);
      if (roomMesh) setRoomMeshColors(roomMesh, next);
      render();
    },
    resize(width, height) {
      if (width <= 0 || height <= 0) return;
      size = { width, height };
      if (!renderer) return;
      renderer.setSize(width, height);
      camera.aspect = aspect();
      if (!input) return;
      const room = roomSize(input);
      applyLimits(room);
      moveTo(currentView(room), false);
    },
    resetView() {
      if (!input) return;
      moveTo(defaultView(roomSize(input), aspect()), true);
    },
    topView() {
      if (!input) return;
      moveTo(toTopView(currentView(roomSize(input))), true);
    },
    handleKey(key) {
      if (!input || !active) return false;
      const room = roomSize(input);
      const next = stepView(
        currentView(room),
        key,
        cameraLimits(room, aspect()),
      );
      if (!next) return false;
      moveTo(next, false);
      return true;
    },
    setActive(next) {
      active = next;
      if (controls) controls.enabled = next;
      if (!next) cancelTransition();
      else render();
    },
    setReducedMotion(reduced) {
      reducedMotion = reduced;
    },
    dispose() {
      cancelTransition();
      controls?.dispose();
      controls = null;
      if (roomMesh) {
        scene.remove(roomMesh.group);
        disposeRoomMesh(roomMesh);
        roomMesh = null;
      }
      if (renderer) {
        renderer.domElement.remove();
        renderer.dispose();
        renderer = null;
      }
    },
  };
}
