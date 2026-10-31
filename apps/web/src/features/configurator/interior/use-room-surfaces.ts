'use client';

import { useQueries } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import { useMemo } from 'react';
import type { SceneSurface, SceneSurfaces } from '@/components/ui';
import { productQuery, useRoomTypes } from '@/lib/api/catalog';
import type { DraftRoom } from '@/lib/draft/schema';
import { selectWarmupStatus, useWarmup } from '@/lib/warmup';

const SURFACE_KEYS = {
  FLOOR: 'floor',
  WALLS: 'walls',
  CEILING: 'ceiling',
} as const;

type SurfaceKey = (typeof SURFACE_KEYS)[keyof typeof SURFACE_KEYS];

export function useRoomSurfaces(room: DraftRoom | null): SceneSurfaces {
  const lang = useLocale() as 'en' | 'uk';
  const ready = useWarmup(selectWarmupStatus) === 'ready';
  const { data: roomTypes } = useRoomTypes();

  const picks = useMemo(() => {
    const roomType = roomTypes?.items.find(
      (item) => item.code === room?.roomTypeCode,
    );
    const result: { key: SurfaceKey; productId: string }[] = [];
    const taken = new Set<SurfaceKey>();
    for (const category of roomType?.categories ?? []) {
      if (category.surface === 'NONE') {
        continue;
      }
      const key = SURFACE_KEYS[category.surface];
      const selection = room?.selections[category.id];
      if (taken.has(key) || !selection || selection.disabled) {
        continue;
      }
      if (selection.productId === null) {
        continue;
      }
      taken.add(key);
      result.push({ key, productId: selection.productId });
    }
    return result;
  }, [roomTypes, room]);

  const products = useQueries({
    queries: picks.map(({ productId }) => ({
      ...productQuery(productId, lang),
      enabled: ready,
    })),
  });

  const surfaces: Partial<Record<SurfaceKey, SceneSurface>> = {};
  picks.forEach(({ key }, index) => {
    const surface = products[index]?.data?.surface;
    if (surface) {
      surfaces[key] = {
        textureUrl: surface.texture.url,
        tileWidthMm: surface.tileWidthMm,
        tileLengthMm: surface.tileLengthMm,
        fallbackColor: surface.fallbackColor,
      };
    }
  });
  return surfaces;
}
