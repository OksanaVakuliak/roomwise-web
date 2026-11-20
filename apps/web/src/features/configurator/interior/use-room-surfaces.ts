'use client';

import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { SceneSurface, SceneSurfaces } from '@/components/ui';
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

const LOADING: SurfaceMaterials = {
  floor: { kind: 'neutral', reason: 'loading' },
  walls: { kind: 'neutral', reason: 'loading' },
  ceiling: { kind: 'neutral', reason: 'loading' },
};

type ProductResult = {
  data: SurfaceProduct | undefined;
  isError: boolean;
};

function combineProducts(results: readonly ProductResult[]) {
  return results.map(({ data, isError }) => ({ data, isError }));
}

export function useRoomSurfaces(room: DraftRoom | null): SurfaceMaterials {
  const lang = useLang();
  const ready = useCatalogReady();
  const { data: roomTypes, isError: roomTypesFailed } = useRoomTypes();

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
    combine: combineProducts,
  });

  return useMemo(() => {
    if (!roomTypes && !roomTypesFailed) {
      return LOADING;
    }
    const loaded = new Map<string, SurfaceProduct>();
    const failed = new Set<string>();
    products.forEach(({ data, isError }, index) => {
      const productId = productIds[index];
      if (data) {
        loaded.set(data.id, data);
      } else if (isError && productId !== undefined) {
        failed.add(productId);
      }
    });
    return resolveSceneMaterials(selections, categories, loaded, failed);
  }, [
    roomTypes,
    roomTypesFailed,
    products,
    productIds,
    selections,
    categories,
  ]);
}

export function toSceneSurfaces({
  floor,
  walls,
}: SurfaceMaterials): SceneSurfaces {
  const surfaces: SceneSurfaces = {};
  const floorSurface = toSceneSurface(floor);
  if (floorSurface) {
    surfaces.floor = floorSurface;
  }
  const wallsSurface = toSceneSurface(walls);
  if (wallsSurface) {
    surfaces.walls = wallsSurface;
  }
  return surfaces;
}

function toSceneSurface(
  material: SurfaceMaterials['floor'],
): SceneSurface | null {
  if (material.kind === 'texture') {
    return {
      textureUrl: material.textureUrl,
      tileWidthMm: material.textureStepMm.widthMm,
      tileLengthMm: material.textureStepMm.lengthMm,
      fallbackColor: material.color,
    };
  }
  if (material.kind === 'color' && material.color !== null) {
    return { fallbackColor: material.color };
  }
  return null;
}
