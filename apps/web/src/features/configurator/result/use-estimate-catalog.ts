'use client';

import { useQueries } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import type { EstimateCatalog, EstimateRoomInput } from '@/features/estimate';
import { toEstimateRooms } from '@/features/estimate';
import {
  productQuery,
  useCatalogReady,
  useEngineering,
  useLang,
  useRoomTypes,
  useStyles,
} from '@/lib/api/catalog';
import { ownName } from '@/lib/engine/accessory-component';
import { useDraft } from '@/stores/draft';
import { usePricingData } from '@/stores/pricing-data';

export type EstimateCatalogState =
  | { status: 'loading' }
  | { status: 'error'; retry: () => void }
  | {
      status: 'ready';
      catalog: EstimateCatalog;
      rooms: readonly EstimateRoomInput[];
      styleName: string | null;
    };

export function useEstimateCatalog(): EstimateCatalogState {
  const t = useTranslations('ResultStep');
  const lang = useLang();
  const ready = useCatalogReady();
  const draftRooms = useDraft((state) => state.rooms);
  const styleId = useDraft((state) => state.styleId);
  const rules = usePricingData((state) => state.data?.rules);
  const accessories = usePricingData((state) => state.data?.accessories);
  const roomTypes = useRoomTypes();
  const engineering = useEngineering();
  const styles = useStyles();

  const productIds = useMemo(() => {
    const ids = new Set<string>();
    for (const room of draftRooms) {
      for (const selection of Object.values(room.selections)) {
        if (selection && !selection.disabled && selection.productId !== null) {
          ids.add(selection.productId);
        }
      }
    }
    return [...ids];
  }, [draftRooms]);

  const products = useQueries({
    queries: productIds.map((id) => ({
      ...productQuery(id, lang),
      enabled: ready,
    })),
  });

  const roomTypeItems = roomTypes.data?.items;
  const engineeringData = engineering.data;
  const styleItems = styles.data?.items;

  const names = useMemo(() => {
    if (!roomTypeItems || !engineeringData) {
      return null;
    }
    return {
      categories: new Map(
        roomTypeItems.flatMap((type) =>
          type.categories.map((category) => [category.id, category.name]),
        ),
      ),
      options: new Map(
        engineeringData.options.map((option) => [option.id, option.name]),
      ),
      packageItems: new Map(
        engineeringData.packageItems.map((item) => [item.id, item.name]),
      ),
    };
  }, [roomTypeItems, engineeringData]);

  const refetch = () => {
    void roomTypes.refetch();
    void engineering.refetch();
    void styles.refetch();
  };

  if (roomTypes.isError || engineering.isError || styles.isError) {
    return { status: 'error', retry: refetch };
  }

  if (
    !roomTypeItems ||
    !names ||
    !styleItems ||
    products.some((query) => query.isPending)
  ) {
    return { status: 'loading' };
  }

  const productNames = new Map(
    products.flatMap((query) =>
      query.data
        ? [
            [
              query.data.id,
              { name: query.data.name, brand: query.data.brand ?? null },
            ] as const,
          ]
        : [],
    ),
  );

  return {
    status: 'ready',
    catalog: {
      product: (id) => productNames.get(id),
      category: (id) => names.categories.get(id),
      option: (id) => names.options.get(id),
      packageItem: (id) => names.packageItems.get(id),
      rule: (id) => rules?.find((rule) => rule.id === id)?.name[lang],
      accessory: (key) => ownName(accessories, key)?.[lang],
    },
    rooms: toEstimateRooms(
      draftRooms,
      (code) =>
        roomTypeItems.find((type) => type.code === code)?.name ??
        t('roomFallback'),
    ),
    styleName: styleItems.find((style) => style.id === styleId)?.name ?? null,
  };
}
