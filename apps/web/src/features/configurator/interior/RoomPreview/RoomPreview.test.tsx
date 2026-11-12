import { act, fireEvent, screen } from '@testing-library/react';
import { type MutableRefObject, useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RoomCanvasProps } from '@/components/ui';
import type { RoomSceneController } from '@/lib/room-3d/engine/controller';
import type { SceneStatus } from '@/lib/room-3d/types';
import { makeDraftRoom } from '@/test/fixtures/draft';
import { renderWithProviders } from '@/test/render-with-providers';
import en from '../../../../../messages/en.json';
import uk from '../../../../../messages/uk.json';
import { RoomPreview } from './RoomPreview';

const controller = vi.hoisted(() => ({
  resetView: vi.fn(),
  topView: vi.fn(),
}));
const canvas = vi.hoisted(() => ({
  props: null as RoomCanvasProps | null,
}));
const support = vi.hoisted(() => ({ webGl: true }));

vi.mock('@/lib/room-3d/support', () => ({
  isWebGlSupported: () => support.webGl,
}));

vi.mock('@/components/ui', async (importActual) => {
  const actual = await importActual<typeof import('@/components/ui')>();
  function RoomCanvas(props: RoomCanvasProps) {
    canvas.props = props;
    const { controllerRef } = props;
    useEffect(() => {
      (controllerRef as MutableRefObject<RoomSceneController | null>).current =
        controller as unknown as RoomSceneController;
    }, [controllerRef]);
    return <div data-testid="canvas" />;
  }
  return { ...actual, RoomCanvas };
});

const first = makeDraftRoom({ clientId: 'room-a' });
const second = makeDraftRoom({ clientId: 'room-b', lengthM: 6, widthM: 3 });

function renderPreview(room = first, locale: 'en' | 'uk' = 'en') {
  return renderWithProviders(<RoomPreview room={room} name="Living room" />, {
    locale,
  });
}

function setStatus(status: SceneStatus) {
  act(() => canvas.props?.onStatus(status));
}

beforeEach(() => {
  vi.clearAllMocks();
  canvas.props = null;
  support.webGl = true;
});

describe('RoomPreview', () => {
  it('builds the scene input from the room in metres', async () => {
    await act(async () => {
      renderPreview();
    });

    expect(canvas.props?.input).toMatchObject({
      roomKey: 'room-a',
      lengthM: first.lengthM,
      widthM: first.widthM,
      heightM: first.heightM,
      surfaces: {
        floor: expect.anything(),
        walls: expect.anything(),
        ceiling: expect.anything(),
      },
    });
    expect(canvas.props?.label).toBe('Living room in 3D');
    expect(canvas.props?.roleDescription).toBe('3D view');
  });

  it('calls the controller from the toolbar buttons', async () => {
    await act(async () => {
      renderPreview();
    });
    setStatus('ready');

    fireEvent.click(screen.getByRole('button', { name: en.RoomPreview.reset }));
    fireEvent.click(screen.getByRole('button', { name: en.RoomPreview.top }));

    expect(controller.resetView).toHaveBeenCalledTimes(1);
    expect(controller.topView).toHaveBeenCalledTimes(1);
  });

  it('keeps the toolbar disabled until the scene is ready', async () => {
    await act(async () => {
      renderPreview();
    });
    const reset = screen.getByRole('button', { name: en.RoomPreview.reset });
    const top = screen.getByRole('button', { name: en.RoomPreview.top });
    expect(reset).toBeDisabled();
    expect(top).toBeDisabled();

    setStatus('ready');

    expect(reset).toBeEnabled();
    expect(top).toBeEnabled();
  });

  it('gives the canvas a new room key when the room changes', async () => {
    let view!: ReturnType<typeof renderPreview>;
    await act(async () => {
      view = renderPreview();
    });
    expect(canvas.props?.input.roomKey).toBe('room-a');

    await act(async () => {
      view.rerender(<RoomPreview room={second} name="Living room" />);
    });

    expect(canvas.props?.input).toMatchObject({
      roomKey: 'room-b',
      lengthM: 6,
      widthM: 3,
    });
  });

  it('shows a skeleton while the engine loads and hides it when ready', async () => {
    await act(async () => {
      renderPreview();
    });

    expect(
      screen.getByRole('status', { name: en.RoomPreview.loading }),
    ).toBeInTheDocument();

    setStatus('ready');

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('renders nothing for a room without dimensions', async () => {
    await act(async () => {
      renderPreview(makeDraftRoom({ clientId: 'room-c', lengthM: null }));
    });

    expect(screen.queryByTestId('canvas')).not.toBeInTheDocument();
  });

  it('renders the canvas once dimensions appear after a first empty render', async () => {
    let view!: ReturnType<typeof renderPreview>;
    await act(async () => {
      view = renderPreview(
        makeDraftRoom({ clientId: 'room-a', lengthM: null }),
      );
    });
    expect(screen.queryByTestId('canvas')).not.toBeInTheDocument();

    await act(async () => {
      view.rerender(<RoomPreview room={first} name="Living room" />);
    });

    expect(screen.getByTestId('canvas')).toBeInTheDocument();
    expect(canvas.props?.colors).toEqual({
      background: expect.any(String),
      neutral: expect.any(String),
      edge: expect.any(String),
    });
  });

  it('localises the texts', async () => {
    await act(async () => {
      renderPreview(first, 'uk');
    });

    expect(
      screen.getByRole('button', { name: uk.RoomPreview.reset }),
    ).toBeInTheDocument();
    expect(canvas.props?.roleDescription).toBe(uk.RoomPreview.roleDescription);
  });

  it('draws the 2D room instead of the canvas when WebGL is unsupported', async () => {
    support.webGl = false;
    await act(async () => {
      renderPreview();
    });

    expect(screen.queryByTestId('canvas')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: en.RoomPreview.reset }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAccessibleName(
      expect.stringContaining('Living room'),
    );
  });

  it.each(['error', 'lost'] as const)(
    'falls back to the 2D room when the canvas reports %s',
    async (status) => {
      await act(async () => {
        renderPreview();
      });
      expect(screen.getByTestId('canvas')).toBeInTheDocument();

      setStatus(status);

      expect(screen.queryByTestId('canvas')).not.toBeInTheDocument();
      expect(screen.getByRole('img')).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: en.RoomPreview.top }),
      ).not.toBeInTheDocument();
    },
  );
});
