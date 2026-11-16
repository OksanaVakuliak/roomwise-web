import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { createRef, type MutableRefObject } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RoomSceneController } from '@/lib/room-3d/engine/controller';
import type {
  RoomSceneInput,
  SceneColors,
  SceneStatus,
} from '@/lib/room-3d/types';
import { RoomCanvas } from './RoomCanvas';

const controller = vi.hoisted(() => ({
  mount: vi.fn(),
  setInput: vi.fn(),
  setColors: vi.fn(),
  resize: vi.fn(),
  resetView: vi.fn(),
  topView: vi.fn(),
  handleKey: vi.fn(() => true),
  setActive: vi.fn(),
  setReducedMotion: vi.fn(),
  dispose: vi.fn(),
}));
const create = vi.hoisted(() => vi.fn());

const input: RoomSceneInput = {
  roomKey: 'a',
  lengthM: 4,
  widthM: 3,
  heightM: 2.7,
  surfaces: {
    floor: { kind: 'neutral', reason: 'unselected' },
    walls: { kind: 'neutral', reason: 'unselected' },
    ceiling: { kind: 'neutral', reason: 'unselected' },
  },
};
const colors: SceneColors = {
  background: '#fff',
  neutral: '#ccc',
  edge: '#000',
};

const resizeCallbacks: ResizeObserverCallback[] = [];
const intersectionCallbacks: IntersectionObserverCallback[] = [];

function renderCanvas(props: Partial<Parameters<typeof RoomCanvas>[0]> = {}) {
  return render(
    <RoomCanvas
      input={input}
      colors={colors}
      reducedMotion={false}
      onStatus={vi.fn()}
      label="Living room"
      roleDescription="3D view"
      describedBy="desc"
      {...props}
    />,
  );
}

const importTimeout = 30_000;

async function settle(
  ready: () => void = () => expect(controller.mount).toHaveBeenCalled(),
) {
  await waitFor(ready, { timeout: importTimeout });
}

beforeEach(() => {
  vi.clearAllMocks();
  resizeCallbacks.length = 0;
  intersectionCallbacks.length = 0;
  create.mockReturnValue(controller);
  vi.resetModules();
  vi.doMock('@/lib/room-3d/engine/controller', () => ({
    createRoomSceneController: create,
  }));
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: ResizeObserverCallback) {
        resizeCallbacks.push(callback);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: IntersectionObserverCallback) {
        intersectionCallbacks.push(callback);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

describe('RoomCanvas', { timeout: importTimeout + 5_000 }, () => {
  it('exposes an accessible focusable group', async () => {
    renderCanvas();
    await settle();
    const group = screen.getByRole('group', { name: 'Living room' });
    expect(group).toHaveAttribute('aria-roledescription', '3D view');
    expect(group).toHaveAttribute('aria-describedby', 'desc');
    expect(group).toHaveAttribute('tabindex', '0');
  });

  it('reports loading, then creates and mounts the controller with data', async () => {
    const onStatus = vi.fn<(status: SceneStatus) => void>();
    renderCanvas({ onStatus });
    expect(onStatus).toHaveBeenCalledWith('loading');
    await settle();
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ reducedMotion: false }),
    );
    expect(controller.mount).toHaveBeenCalledTimes(1);
    expect(controller.setInput).toHaveBeenCalledWith(input);
    expect(controller.setColors).toHaveBeenCalledWith(colors);
  });

  it('forwards the controller status callback', async () => {
    const onStatus = vi.fn<(status: SceneStatus) => void>();
    renderCanvas({ onStatus });
    await settle();
    create.mock.calls[0][0].onStatus('ready');
    expect(onStatus).toHaveBeenCalledWith('ready');
  });

  it('fills controllerRef and clears it on unmount', async () => {
    const ref =
      createRef<RoomSceneController | null>() as MutableRefObject<RoomSceneController | null>;
    const { unmount } = renderCanvas({ controllerRef: ref });
    await settle();
    expect(ref.current).toBe(controller);
    unmount();
    expect(ref.current).toBeNull();
    expect(controller.dispose).toHaveBeenCalledTimes(1);
  });

  it('forwards prop changes', async () => {
    const { rerender } = renderCanvas();
    await settle();
    const next = { ...input, roomKey: 'b' };
    const nextColors = { ...colors, background: '#000' };
    rerender(
      <RoomCanvas
        input={next}
        colors={nextColors}
        reducedMotion
        onStatus={vi.fn()}
        label="Living room"
        roleDescription="3D view"
      />,
    );
    expect(controller.setInput).toHaveBeenLastCalledWith(next);
    expect(controller.setColors).toHaveBeenLastCalledWith(nextColors);
    expect(controller.setReducedMotion).toHaveBeenLastCalledWith(true);
  });

  it('does not mount when unmounted during the import', async () => {
    const { unmount } = renderCanvas();
    unmount();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });
    expect(controller.mount).not.toHaveBeenCalled();
  });

  it('resizes on observer notifications', async () => {
    renderCanvas();
    await settle();
    act(() => {
      resizeCallbacks[0](
        [{ contentRect: { width: 320, height: 200 } } as ResizeObserverEntry],
        {} as ResizeObserver,
      );
    });
    expect(controller.resize).toHaveBeenCalledWith(320, 200);
  });

  it('pauses when scrolled out of view', async () => {
    renderCanvas();
    await settle();
    act(() => {
      intersectionCallbacks[0](
        [{ isIntersecting: false } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });
    expect(controller.setActive).toHaveBeenLastCalledWith(false);
  });

  describe('page visibility', () => {
    function setVisibility(state: DocumentVisibilityState) {
      vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(state);
      document.dispatchEvent(new Event('visibilitychange'));
    }

    function intersect(isIntersecting: boolean) {
      intersectionCallbacks[0](
        [{ isIntersecting } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    }

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('pauses when the tab is hidden and resumes when it is shown', async () => {
      renderCanvas();
      await settle();
      act(() => setVisibility('hidden'));
      expect(controller.setActive).toHaveBeenLastCalledWith(false);
      act(() => setVisibility('visible'));
      expect(controller.setActive).toHaveBeenLastCalledWith(true);
    });

    it('stays paused while the canvas is out of view, even if the tab is shown', async () => {
      renderCanvas();
      await settle();
      act(() => intersect(false));
      act(() => setVisibility('visible'));
      expect(controller.setActive).toHaveBeenLastCalledWith(false);
      act(() => intersect(true));
      expect(controller.setActive).toHaveBeenLastCalledWith(true);
    });

    it('stays paused while the tab is hidden, even if the canvas comes into view', async () => {
      renderCanvas();
      await settle();
      act(() => setVisibility('hidden'));
      act(() => intersect(true));
      expect(controller.setActive).toHaveBeenLastCalledWith(false);
    });

    it('resumes when the tab becomes visible while the controller is loading', async () => {
      const state = vi
        .spyOn(document, 'visibilityState', 'get')
        .mockReturnValue('hidden');
      renderCanvas();
      state.mockReturnValue('visible');
      await settle();
      expect(controller.setActive).toHaveBeenLastCalledWith(true);
    });

    it('stops listening after unmount', async () => {
      const { unmount } = renderCanvas();
      await settle();
      unmount();
      controller.setActive.mockClear();
      act(() => setVisibility('hidden'));
      expect(controller.setActive).not.toHaveBeenCalled();
    });
  });

  it('forwards keys to the controller and prevents default only when handled', async () => {
    renderCanvas();
    await settle();
    const group = screen.getByRole('group');
    expect(fireEvent.keyDown(group, { key: 'ArrowLeft' })).toBe(false);
    expect(controller.handleKey).toHaveBeenLastCalledWith('ArrowLeft');
    controller.handleKey.mockReturnValueOnce(false);
    expect(fireEvent.keyDown(group, { key: 'Tab' })).toBe(true);
    expect(controller.handleKey).toHaveBeenLastCalledWith('Tab');
  });

  it.each([
    ['Ctrl', { key: '=', ctrlKey: true }],
    ['Meta', { key: '-', metaKey: true }],
    ['Alt', { key: 'ArrowLeft', altKey: true }],
  ])('leaves %s shortcuts to the browser', async (_name, init) => {
    renderCanvas();
    await settle();
    controller.handleKey.mockClear();

    expect(fireEvent.keyDown(screen.getByRole('group'), init)).toBe(true);
    expect(controller.handleKey).not.toHaveBeenCalled();
  });

  it('reports an error when creating or mounting throws', async () => {
    controller.mount.mockImplementationOnce(() => {
      throw new Error('boom');
    });
    const onStatus = vi.fn<(status: SceneStatus) => void>();
    renderCanvas({ onStatus });
    await settle(() => expect(onStatus).toHaveBeenLastCalledWith('error'));
  });
});
