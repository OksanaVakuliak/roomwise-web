'use client';

import { useLocale, useTranslations } from 'next-intl';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  RoomCanvas,
  RoomScene,
  SceneToolbar,
  type SceneToolbarAction,
  Skeleton,
  VisuallyHidden,
} from '@/components/ui';
import { cx } from '@/lib/cx';
import type { DraftRoom } from '@/lib/draft/schema';
import { area, dimension } from '@/lib/format';
import { usePrefersReducedMotion } from '@/lib/media';
import type { RoomSceneController } from '@/lib/room-3d/engine/controller';
import { isWebGlSupported } from '@/lib/room-3d/support';
import type {
  RoomSceneInput,
  SceneColors,
  SceneStatus,
} from '@/lib/room-3d/types';
import { toSceneSurfaces, useRoomSurfaces } from '../use-room-surfaces';
import styles from './RoomPreview.module.css';
import { useSceneExpand } from './use-scene-expand';

export type RoomPreviewProps = {
  room: DraftRoom;
  name: string;
};

function readColors(element: HTMLElement): SceneColors {
  const style = getComputedStyle(element);
  const token = (name: string) => style.getPropertyValue(name).trim();
  return {
    background: token('--paper'),
    neutral: token('--paint'),
    edge: token('--line'),
  };
}

export function RoomPreview({ room, name }: RoomPreviewProps) {
  const t = useTranslations('RoomPreview');
  const locale = useLocale();
  const descriptionId = useId();
  const reducedMotion = usePrefersReducedMotion();
  const surfaces = useRoomSurfaces(room);
  const stageRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const expand = useSceneExpand(slotRef, rootRef);
  const controllerRef = useRef<RoomSceneController | null>(null);
  const [colors, setColors] = useState<SceneColors | null>(null);
  const [status, setStatus] = useState<SceneStatus>('loading');
  const [webGl, setWebGl] = useState<boolean | null>(null);

  const { lengthM, widthM, heightM } = room;
  const hasDimensions = lengthM !== null && widthM !== null && heightM !== null;

  useEffect(() => {
    if (hasDimensions && stageRef.current) {
      setColors(readColors(stageRef.current));
      setWebGl(isWebGlSupported());
    }
  }, [hasDimensions]);

  const input = useMemo<RoomSceneInput | null>(
    () =>
      lengthM === null || widthM === null || heightM === null
        ? null
        : { roomKey: room.clientId, lengthM, widthM, heightM, surfaces },
    [room.clientId, lengthM, widthM, heightM, surfaces],
  );

  useEffect(() => {
    if (!hasDimensions) return;
    const observer = new MutationObserver(() => {
      if (stageRef.current) setColors(readColors(stageRef.current));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, [hasDimensions]);

  const resetView = useCallback(() => controllerRef.current?.resetView(), []);
  const topView = useCallback(() => controllerRef.current?.topView(), []);

  if (
    input === null ||
    lengthM === null ||
    widthM === null ||
    heightM === null
  ) {
    return null;
  }

  const disabled = status !== 'ready';
  const actions: SceneToolbarAction[] = [
    {
      id: 'reset',
      label: t('reset'),
      icon: 'resetView',
      onClick: resetView,
      disabled,
    },
    { id: 'top', label: t('top'), icon: 'topView', onClick: topView, disabled },
  ];
  if (expand.available) {
    actions.push({
      id: 'expand',
      label: expand.expanded ? t('collapse') : t('expand'),
      icon: expand.expanded ? 'collapse' : 'expand',
      onClick: expand.toggle,
      disabled,
    });
  }

  if (webGl === false || status === 'error' || status === 'lost') {
    const lengthLabel = dimension(lengthM, locale);
    const widthLabel = dimension(widthM, locale);
    const heightLabel = dimension(heightM, locale);
    return (
      <RoomScene
        lengthCm={Math.round(lengthM * 100)}
        widthCm={Math.round(widthM * 100)}
        heightCm={Math.round(heightM * 100)}
        lengthLabel={lengthLabel}
        widthLabel={widthLabel}
        heightLabel={heightLabel}
        surfaces={toSceneSurfaces(surfaces)}
        cutLabel={t('cut')}
        description={t('fallbackDescription', {
          name,
          length: lengthLabel,
          width: widthLabel,
          height: heightLabel,
        })}
      />
    );
  }

  return (
    <div
      ref={slotRef}
      className={cx(styles.slot, expand.mode !== 'idle' && styles.held)}
      style={expand.slotStyle}
    >
      <div
        ref={rootRef}
        className={cx(styles.root, expand.mode !== 'idle' && styles.floating)}
        data-mode={expand.mode}
        data-expanded={expand.expanded}
        style={expand.rootStyle}
        onTransitionEnd={expand.onTransitionEnd}
      >
        <div ref={stageRef} className={styles.stage}>
          {colors ? (
            <RoomCanvas
              input={input}
              colors={colors}
              reducedMotion={reducedMotion}
              onStatus={setStatus}
              label={t('label', { name })}
              describedBy={descriptionId}
              roleDescription={t('roleDescription')}
              controllerRef={controllerRef}
            />
          ) : null}
          <VisuallyHidden>
            <span id={descriptionId}>
              {t('description', {
                name,
                length: dimension(lengthM, locale),
                width: dimension(widthM, locale),
                height: dimension(heightM, locale),
                area: area(lengthM * widthM, locale),
              })}
            </span>
          </VisuallyHidden>
          {colors === null || status === 'loading' ? (
            <div
              className={styles.loading}
              role="status"
              aria-label={t('loading')}
            >
              <Skeleton variant="block" width="100%" height="100%" />
            </div>
          ) : null}
        </div>
        <SceneToolbar actions={actions} />
      </div>
    </div>
  );
}
