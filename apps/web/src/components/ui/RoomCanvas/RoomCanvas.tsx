'use client';

import {
  type KeyboardEvent,
  type MutableRefObject,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import type { RoomSceneController } from '@/lib/room-3d/engine/controller';
import type {
  RoomSceneInput,
  SceneColors,
  SceneStatus,
} from '@/lib/room-3d/types';
import styles from './RoomCanvas.module.css';

export type RoomCanvasProps = {
  input: RoomSceneInput;
  colors: SceneColors;
  reducedMotion: boolean;
  onStatus: (status: SceneStatus) => void;
  label: string;
  roleDescription: string;
  describedBy?: string;
  controllerRef?: MutableRefObject<RoomSceneController | null>;
};

export function RoomCanvas({
  input,
  colors,
  reducedMotion,
  onStatus,
  label,
  roleDescription,
  describedBy,
  controllerRef,
}: RoomCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<RoomSceneController | null>(null);
  const latest = useRef({ input, colors, reducedMotion, onStatus });

  useEffect(() => {
    latest.current = { input, colors, reducedMotion, onStatus };
    const controller = instanceRef.current;
    if (!controller) return;
    controller.setInput(input);
    controller.setColors(colors);
    controller.setReducedMotion(reducedMotion);
  }, [input, colors, reducedMotion, onStatus]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    let controller: RoomSceneController | null = null;
    let resizeObserver: ResizeObserver | undefined;
    let intersectionObserver: IntersectionObserver | undefined;

    latest.current.onStatus('loading');

    void import('@/lib/room-3d/engine/controller')
      .then(({ createRoomSceneController }) => {
        if (cancelled) return;
        controller = createRoomSceneController({
          reducedMotion: latest.current.reducedMotion,
          onStatus: (status) => latest.current.onStatus(status),
        });
        instanceRef.current = controller;
        if (controllerRef) controllerRef.current = controller;
        controller.mount(container);
        controller.setColors(latest.current.colors);
        controller.setInput(latest.current.input);

        if (typeof ResizeObserver !== 'undefined') {
          resizeObserver = new ResizeObserver(([entry]) => {
            if (!entry) return;
            const { width, height } = entry.contentRect;
            controller?.resize(width, height);
          });
          resizeObserver.observe(container);
        }
        if (typeof IntersectionObserver !== 'undefined') {
          intersectionObserver = new IntersectionObserver(([entry]) => {
            if (!entry) return;
            controller?.setActive(entry.isIntersecting);
          });
          intersectionObserver.observe(container);
        }
      })
      .catch(() => {
        if (!cancelled) latest.current.onStatus('error');
      });

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      controller?.dispose();
      instanceRef.current = null;
      if (controllerRef) controllerRef.current = null;
    };
  }, [controllerRef]);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (instanceRef.current?.handleKey(event.key)) event.preventDefault();
  }, []);

  return (
    <div
      ref={containerRef}
      className={styles.root}
      role="group"
      aria-roledescription={roleDescription}
      aria-label={label}
      aria-describedby={describedBy}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    />
  );
}
