'use client';

import { useEffect } from 'react';
import { useRoomTypes } from '@/lib/api/catalog';
import { useDraft } from '@/stores/draft';

export function useSurfaceNormalization(hydrated: boolean): void {
  const { data: roomTypes } = useRoomTypes();
  const normalizeSurfaces = useDraft((state) => state.normalizeSurfaces);

  useEffect(() => {
    if (hydrated && roomTypes) {
      normalizeSurfaces(roomTypes);
    }
  }, [hydrated, normalizeSurfaces, roomTypes]);
}
