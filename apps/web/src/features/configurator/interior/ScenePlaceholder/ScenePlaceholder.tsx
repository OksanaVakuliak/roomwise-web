'use client';

import { useLocale, useTranslations } from 'next-intl';
import { RoomScene, type SceneSurfaces } from '@/components/ui';
import { dimension } from '@/lib/format';

export type ScenePlaceholderProps = {
  name: string;
  lengthM: number;
  widthM: number;
  heightM: number;
  surfaces?: SceneSurfaces;
};

export function ScenePlaceholder({
  name,
  lengthM,
  widthM,
  heightM,
  surfaces,
}: ScenePlaceholderProps) {
  const t = useTranslations('InteriorStep');
  const locale = useLocale();
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
      surfaces={surfaces}
      cutLabel={t('scene.cut')}
      description={t('scene.description', {
        name,
        length: lengthLabel,
        width: widthLabel,
        height: heightLabel,
      })}
    />
  );
}
