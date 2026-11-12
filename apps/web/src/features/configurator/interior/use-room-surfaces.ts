'use client';

import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { SceneSurfaces } from '@/components/ui';
import {
  productQuery,
  useCatalogReady,
  useLang,
  useRoomTypes,
} from '@/lib/api/catalog';
import type { DraftRoom } from '@/lib/draft/schema';
import { categoriesOfRoomType } from '@/lib/draft/surfaces';
import {
  resolveSceneMaterials,
  type SurfaceMaterials,
  type SurfaceProduct,
  surfaceProductIds,
} from '@/lib/room-3d/materials';

const NO_SELECTIONS: DraftRoom['selections'] = {};

export function useRoomSurfaces(room: DraftRoom | null): SurfaceMaterials {
  const lang = useLang();
  const ready = useCatalogReady();
  const { data: roomTypes } = useRoomTypes();

  const categories = useMemo(
    () =>
      roomTypes
        ? categoriesOfRoomType(room?.roomTypeCode ?? null, roomTypes)
        : [],
    [roomTypes, room?.roomTypeCode],
  );
  const selections = room?.selections ?? NO_SELECTIONS;

  const productIds = useMemo(
    () => surfaceProductIds(selections, categories),
    [selections, categories],
  );

  const products = useQueries({
    queries: productIds.map((productId) => ({
      ...productQuery(productId, lang),
      enabled: ready,
    })),
    combine: (results) => results.map(({ data }) => data),
  });

  return useMemo(() => {
    const loaded = new Map<string, SurfaceProduct>();
    for (const data of products) {
      if (data) {
        loaded.set(data.id, data);
      }
    }
    return resolveSceneMaterials(selections, categories, loaded);
  }, [products, selections, categories]);
}

export function toSceneSurfaces({
  floor,
  walls,
}: SurfaceMaterials): SceneSurfaces {
  const surfaces: SceneSurfaces = {};
  if (floor.kind === 'texture') {
    surfaces.floor = toSceneSurface(floor);
  }
  if (walls.kind === 'texture') {
    surfaces.walls = toSceneSurface(walls);
  }
  return surfaces;
}

function toSceneSurface(
  material: Extract<SurfaceMaterials['floor'], { kind: 'texture' }>,
) {
  return {
    textureUrl: material.textureUrl,
    tileWidthMm: material.textureStepMm.widthMm,
    tileLengthMm: material.textureStepMm.lengthMm,
    fallbackColor: material.color,
  };
}
