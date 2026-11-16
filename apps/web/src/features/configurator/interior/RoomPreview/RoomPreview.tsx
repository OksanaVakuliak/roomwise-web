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
  Button,
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
  SurfaceKey,
} from '@/lib/room-3d/types';
import { usePreferences } from '@/stores/preferences';
import { toSceneSurfaces, useRoomSurfaces } from '../use-room-surfaces';
import styles from './RoomPreview.module.css';
import {
  expandVariables,
  slotVariables,
  useSceneExpand,
} from './use-scene-expand';

export type RoomPreviewProps = {
  room: DraftRoom;
  name: string;
};

const SURFACE_ORDER: SurfaceKey[] = ['floor', 'walls', 'ceiling'];

type FallbackReason = 'unsupported' | 'lost' | 'manual';

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
  const controllerRef = useRef<RoomSceneController | null>(null);
  const enableRef = useRef<HTMLButtonElement>(null);
  const retryRef = useRef<HTMLButtonElement>(null);
  const fallbackRef = useRef<HTMLDivElement>(null);
  const disableRef = useRef<HTMLButtonElement>(null);
  const focusAfterToggle = useRef<'enable' | 'disable' | 'auto' | null>(null);
  const [colors, setColors] = useState<SceneColors | null>(null);
  const [status, setStatus] = useState<SceneStatus>('loading');
  const [webGl, setWebGl] = useState<boolean | null>(null);
  const [attempt, setAttempt] = useState(0);
  const scene3d = usePreferences((state) => state.scene3d);
  const setScene3d = usePreferences((state) => state.setScene3d);

  const { lengthM, widthM, heightM } = room;
  const hasDimensions = lengthM !== null && widthM !== null && heightM !== null;
  let reason: FallbackReason | null = null;
  if (webGl === false || status === 'error') reason = 'unsupported';
  else if (status === 'lost') reason = 'lost';
  else if (!scene3d) reason = 'manual';
  const expand = useSceneExpand(
    slotRef,
    rootRef,
    hasDimensions && reason === null,
  );

  useEffect(() => {
    const target = focusAfterToggle.current;
    if (target === null) return;
    focusAfterToggle.current = null;
    if (target === 'enable' && reason === 'manual') enableRef.current?.focus();
    if (target === 'disable' && reason === null) disableRef.current?.focus();
    if (target === 'auto' && (reason === 'lost' || reason === 'unsupported')) {
      (retryRef.current ?? fallbackRef.current)?.focus();
    }
  }, [reason]);

  useEffect(() => {
    if (!scene3d) setStatus('loading');
  }, [scene3d]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: a failed scene is tried again for every room
  useEffect(() => {
    setStatus((current) =>
      current === 'lost' || current === 'error' ? 'loading' : current,
    );
  }, [room.clientId]);

  useEffect(() => {
    if (hasDimensions) setWebGl(isWebGlSupported());
  }, [hasDimensions]);

  useEffect(() => {
    if (hasDimensions && reason === null && stageRef.current) {
      setColors(readColors(stageRef.current));
    }
  }, [hasDimensions, reason]);

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
  const disable3d = useCallback(() => {
    focusAfterToggle.current = 'enable';
    setScene3d(false);
  }, [setScene3d]);
  const retry3d = useCallback(() => {
    focusAfterToggle.current = 'disable';
    setStatus('loading');
    setAttempt((current) => current + 1);
  }, []);
  const handleStatus = useCallback((next: SceneStatus) => {
    if (
      (next === 'lost' || next === 'error') &&
      slotRef.current?.contains(document.activeElement)
    ) {
      focusAfterToggle.current = 'auto';
    }
    setStatus(next);
  }, []);
  const enable3d = useCallback(() => {
    focusAfterToggle.current = 'disable';
    setScene3d(true);
  }, [setScene3d]);

  if (
    input === null ||
    lengthM === null ||
    widthM === null ||
    heightM === null
  ) {
    return null;
  }

  if (reason !== null) {
    const lengthLabel = dimension(lengthM, locale);
    const widthLabel = dimension(widthM, locale);
    const heightLabel = dimension(heightM, locale);
    return (
      <div ref={fallbackRef} className={styles.fallback} tabIndex={-1}>
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
        <p className={styles.reason} role="status">
          {t(`fallback.${reason}`)}
        </p>
        <ul className={styles.surfaces}>
          {SURFACE_ORDER.map((key) => {
            const material = surfaces[key];
            return (
              <li key={key}>
                {t(`surface.${key}`, {
                  material:
                    material.kind === 'neutral'
                      ? t(
                          material.reason === 'disabled'
                            ? 'surface.excluded'
                            : 'surface.none',
                        )
                      : material.name,
                })}
              </li>
            );
          })}
        </ul>
        {reason === 'manual' ? (
          <Button ref={enableRef} className={styles.toggle} onClick={enable3d}>
            {t('enable')}
          </Button>
        ) : null}
        {reason === 'lost' ? (
          <Button ref={retryRef} className={styles.toggle} onClick={retry3d}>
            {t('retry')}
          </Button>
        ) : null}
      </div>
    );
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
      disabled: disabled && !expand.expanded,
    });
  }

  return (
    <div
      ref={slotRef}
      className={cx(styles.slot, expand.mode !== 'idle' && styles.held)}
      style={slotVariables(expand.geometry)}
    >
      <div
        ref={rootRef}
        className={cx(styles.root, expand.mode !== 'idle' && styles.floating)}
        data-mode={expand.mode}
        data-expanded={expand.expanded}
        style={expandVariables(expand.geometry)}
        onTransitionEnd={expand.onTransitionEnd}
      >
        <div ref={stageRef} className={styles.stage}>
          {colors ? (
            <RoomCanvas
              key={attempt}
              input={input}
              colors={colors}
              reducedMotion={reducedMotion}
              onStatus={handleStatus}
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
        <Button ref={disableRef} className={styles.toggle} onClick={disable3d}>
          {t('disable')}
        </Button>
      </div>
    </div>
  );
}
