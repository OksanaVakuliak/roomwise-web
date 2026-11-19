'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import { RoomCanvas, RoomScene } from '@/components/ui';
import { dimension } from '@/lib/format';
import { usePrefersReducedMotion } from '@/lib/media';
import type { RoomSceneInput, SceneStatus } from '@/lib/room-3d/types';
import { useSceneColors } from '@/lib/room-3d/use-scene-colors';
import styles from './RoomCanvasSection.module.css';

const ROOM = { lengthM: 4.2, widthM: 3.6, heightM: 2.7 };

const NEUTRAL = { kind: 'neutral', reason: 'unselected' } as const;

const NEUTRAL_INPUT: RoomSceneInput = {
  roomKey: 'showcase-neutral',
  ...ROOM,
  surfaces: { floor: NEUTRAL, walls: NEUTRAL, ceiling: NEUTRAL },
};

const COLORED_INPUT: RoomSceneInput = {
  roomKey: 'showcase-colored',
  ...ROOM,
  surfaces: {
    floor: { kind: 'color', productId: 'floor', name: 'Oak', color: '#b08a5c' },
    walls: {
      kind: 'color',
      productId: 'walls',
      name: 'Paint',
      color: '#dcd3c4',
    },
    ceiling: NEUTRAL,
  },
};

type CanvasStageProps = {
  input: RoomSceneInput;
  label: string;
  caption: string;
};

function CanvasStage({ input, label, caption }: CanvasStageProps) {
  const t = useTranslations('ShowcaseRoomCanvas');
  const descriptionId = useId();
  const reducedMotion = usePrefersReducedMotion();
  const [stage, setStage] = useState<HTMLDivElement | null>(null);
  const colors = useSceneColors(stage);
  const [status, setStatus] = useState<SceneStatus>('loading');

  return (
    <div className={styles.stack}>
      <p>{caption}</p>
      <div ref={setStage} className={styles.stage}>
        {colors ? (
          <RoomCanvas
            input={input}
            colors={colors}
            reducedMotion={reducedMotion}
            onStatus={setStatus}
            label={label}
            describedBy={descriptionId}
            roleDescription={t('roleDescription')}
          />
        ) : null}
      </div>
      <p id={descriptionId} className={styles.status}>
        {t('status', { status: t(`statuses.${status}`) })}
      </p>
    </div>
  );
}

export function RoomCanvasSection() {
  const t = useTranslations('ShowcaseRoomCanvas');
  const locale = useLocale();

  const lengthLabel = dimension(ROOM.lengthM, locale);
  const widthLabel = dimension(ROOM.widthM, locale);
  const heightLabel = dimension(ROOM.heightM, locale);
  const bedroom = t('bedroom');

  return (
    <>
      <p>{t('intro')}</p>

      <h3>{t('neutralHeading')}</h3>
      <CanvasStage
        input={NEUTRAL_INPUT}
        label={t('label', { name: bedroom })}
        caption={t('neutralCaption')}
      />

      <h3>{t('coloredHeading')}</h3>
      <CanvasStage
        input={COLORED_INPUT}
        label={t('label', { name: bedroom })}
        caption={t('coloredCaption')}
      />

      <h3>{t('fallbackHeading')}</h3>
      <p>{t('fallbackCaption')}</p>
      <div className={styles.fallback}>
        <RoomScene
          lengthCm={Math.round(ROOM.lengthM * 100)}
          widthCm={Math.round(ROOM.widthM * 100)}
          heightCm={Math.round(ROOM.heightM * 100)}
          lengthLabel={lengthLabel}
          widthLabel={widthLabel}
          heightLabel={heightLabel}
          description={t('fallbackDescription', {
            name: bedroom,
            length: lengthLabel,
            width: widthLabel,
            height: heightLabel,
          })}
        />
      </div>
    </>
  );
}
