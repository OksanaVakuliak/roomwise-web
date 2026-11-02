'use client';

import { useEffect } from 'react';
import {
  useDefaultMaterials,
  useRoomTypes,
  useStyles,
} from '@/lib/api/catalog';
import { useDraft } from '@/stores/draft';
import { usePricingData } from '@/stores/pricing-data';

export function useDraftReconciliation(hydrated: boolean): void {
  const pricingData = usePricingData((state) => state.data);
  const { data: roomTypes } = useRoomTypes();
  const { data: styles } = useStyles();
  const styleId = useDraft((state) => state.styleId);
  const materials = useDefaultMaterials(styleId);
  const reconcileCatalog = useDraft((state) => state.reconcileCatalog);

  const materialsSettled =
    styleId === null || materials.isSuccess || materials.isError;
  const defaultMaterials = materials.isSuccess ? materials.data : null;

  useEffect(() => {
    if (hydrated && pricingData && roomTypes && styles && materialsSettled) {
      reconcileCatalog({
        pricingData,
        roomTypes,
        defaultMaterials,
        styleIds: styles.items.map((style) => style.id),
      });
    }
  }, [
    hydrated,
    pricingData,
    roomTypes,
    styles,
    materialsSettled,
    defaultMaterials,
    reconcileCatalog,
  ]);
}
