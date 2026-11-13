import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { type MutableRefObject, useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RoomCanvasProps } from '@/components/ui';
import { area, dimension } from '@/lib/format';
import type { RoomSceneController } from '@/lib/room-3d/engine/controller';
import type { SceneStatus } from '@/lib/room-3d/types';
import { makeDraftRoom } from '@/test/fixtures/draft';
import { renderWithProviders } from '@/test/render-with-providers';
import { setViewport } from '@/test/viewports';
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

const normalized = (text: string) => text.replace(/\s+/g, ' ');

function renderPreview(room = first, locale: 'en' | 'uk' = 'en') {
  return renderWithProviders(<RoomPreview room={room} name="Living room" />, {
    locale,
  });
}

function setStatus(status: SceneStatus) {
  act(() => canvas.props?.onStatus(status));
}

const originalMatchMedia = window.matchMedia;
const originalWidth = window.innerWidth;

function reduceMotion() {
  const base = window.matchMedia;
  window.matchMedia = ((query: string) => {
    const list = base(query);
    return query.includes('prefers-reduced-motion')
      ? { ...list, matches: true }
      : list;
  }) as typeof window.matchMedia;
}

function previewRoot() {
  return document.querySelector('[data-mode]') as HTMLElement;
}

beforeEach(() => {
  vi.clearAllMocks();
  canvas.props = null;
  support.webGl = true;
});

afterEach(() => {
  window.matchMedia = originalMatchMedia;
  window.innerWidth = originalWidth;
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

  it('describes the room dimensions to screen readers', async () => {
    await act(async () => {
      renderPreview();
    });

    const id = canvas.props?.describedBy as string;
    const description = document.getElementById(id);
    const lengthM = first.lengthM as number;
    const widthM = first.widthM as number;
    const heightM = first.heightM as number;
    expect(description).toHaveTextContent(
      normalized(
        `Living room, ${dimension(lengthM, 'en')} × ${dimension(widthM, 'en')}, height ${dimension(heightM, 'en')}, area ${area(lengthM * widthM, 'en')}`,
      ),
    );
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

  it('re-reads the colours when the theme changes', async () => {
    await act(async () => {
      renderPreview();
    });
    const before = canvas.props?.colors;
    const tokens: Record<string, string> = {
      '--paper': '#101010',
      '--paint': '#202020',
      '--line': '#303030',
    };
    const style = vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: (name: string) => tokens[name] ?? '',
    } as unknown as CSSStyleDeclaration);

    document.documentElement.setAttribute('data-theme', 'dark');

    try {
      await waitFor(() =>
        expect(canvas.props?.colors).toEqual({
          background: '#101010',
          neutral: '#202020',
          edge: '#303030',
        }),
      );
      expect(canvas.props?.colors).not.toEqual(before);
    } finally {
      style.mockRestore();
      document.documentElement.removeAttribute('data-theme');
    }
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

  describe('expanding over the side panels', () => {
    async function renderReady() {
      let view!: ReturnType<typeof renderPreview>;
      await act(async () => {
        view = renderPreview();
      });
      setStatus('ready');
      return view;
    }

    it('has no expand button on a phone', async () => {
      setViewport(390);
      await renderReady();

      expect(
        screen.queryByRole('button', { name: en.RoomPreview.expand }),
      ).not.toBeInTheDocument();
    });

    it('has an expand button from tablet width', async () => {
      setViewport(1024);
      await renderReady();

      expect(
        screen.getByRole('button', { name: en.RoomPreview.expand }),
      ).toBeInTheDocument();
      expect(previewRoot()).toHaveAttribute('data-expanded', 'false');
    });

    it('expands on click and returns after the transition ends', async () => {
      setViewport(1024);
      await renderReady();
      const button = screen.getByRole('button', {
        name: en.RoomPreview.expand,
      });
      button.focus();

      fireEvent.click(button);

      expect(previewRoot()).toHaveAttribute('data-expanded', 'true');
      expect(previewRoot()).toHaveAttribute('data-mode', 'open');
      expect(button).toHaveAccessibleName(en.RoomPreview.collapse);

      fireEvent.click(button);

      expect(previewRoot()).toHaveAttribute('data-expanded', 'false');
      expect(previewRoot()).toHaveAttribute('data-mode', 'leave');
      expect(button).toHaveAccessibleName(en.RoomPreview.expand);

      fireEvent.transitionEnd(previewRoot());

      expect(previewRoot()).toHaveAttribute('data-mode', 'idle');
      expect(button).toHaveFocus();
    });

    it('collapses on Escape', async () => {
      setViewport(1024);
      await renderReady();
      const button = screen.getByRole('button', {
        name: en.RoomPreview.expand,
      });
      button.focus();
      fireEvent.click(button);

      fireEvent.keyDown(document, { key: 'Escape' });
      fireEvent.transitionEnd(previewRoot());

      expect(previewRoot()).toHaveAttribute('data-mode', 'idle');
      expect(button).toHaveAccessibleName(en.RoomPreview.expand);
      expect(button).toHaveFocus();
    });

    it('switches instantly with reduced motion', async () => {
      setViewport(1024);
      reduceMotion();
      await renderReady();
      const button = screen.getByRole('button', {
        name: en.RoomPreview.expand,
      });

      fireEvent.click(button);

      expect(previewRoot()).toHaveAttribute('data-mode', 'open');

      fireEvent.click(button);

      expect(previewRoot()).toHaveAttribute('data-mode', 'idle');
    });

    it('collapses instantly when the viewport drops below tablet width', async () => {
      setViewport(1024);
      const view = await renderReady();
      fireEvent.click(
        screen.getByRole('button', { name: en.RoomPreview.expand }),
      );
      expect(previewRoot()).toHaveAttribute('data-mode', 'open');

      act(() => setViewport(600));
      await act(async () => {
        view.rerender(<RoomPreview room={first} name="Living room" />);
      });

      expect(previewRoot()).toHaveAttribute('data-mode', 'idle');
      expect(
        screen.queryByRole('button', { name: en.RoomPreview.collapse }),
      ).not.toBeInTheDocument();
    });
  });
});
