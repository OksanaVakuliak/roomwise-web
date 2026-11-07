'use client';

import type { EstimateLine } from '@roomwise/calc-engine';
import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import type { SpecComponentsItem } from '@/components/ui';
import type { RoomPricing } from '../shell/use-room-pricing';

const KEYS = {
  MATERIAL: 'material',
  LABOR: 'labor',
  PREP: 'prep',
} as const;

export type SpecCategory = {
  id: string;
  name: string;
  surface: 'FLOOR' | 'WALLS' | 'CEILING' | 'NONE';
};

export type LineDetails = {
  items: SpecComponentsItem[];
  laborMissing: boolean;
};

export function useSpecComponents(
  pricing: RoomPricing | null,
  categories: readonly SpecCategory[],
): (line: EstimateLine | null | undefined) => LineDetails {
  const t = useTranslations('Specification');
  const tSurface = useTranslations('Surface');

  return useCallback(
    (line) => {
      if (!pricing?.partial || !line?.components) {
        return { items: [], laborMissing: false };
      }
      const items = line.components.flatMap((component, index) => {
        const id = `${component.kind}-${index}`;
        if (component.sharedWithCategoryId) {
          const owner = categories.find(
            (category) => category.id === component.sharedWithCategoryId,
          );
          return owner && owner.surface !== 'NONE'
            ? [
                {
                  id,
                  label: t('prepShared', {
                    surface: tSurface(`for.${owner.surface}`),
                    name: owner.name,
                  }),
                },
              ]
            : [];
        }
        if (component.kind !== 'MATERIAL' && component.amountCents === 0) {
          return [];
        }
        return [
          {
            id,
            label: t(`components.${KEYS[component.kind]}`),
            amount: pricing.formatUnitPrice(component.amountCents),
          },
        ];
      });
      return {
        items,
        laborMissing: line.warnings.some(
          (warning) => warning.code === 'LABOR_RATE_MISSING',
        ),
      };
    },
    [pricing, categories, t, tSurface],
  );
}
