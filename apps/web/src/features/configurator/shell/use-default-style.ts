'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import {
  defaultMaterialsQuery,
  useRoomTypes,
  useStyles,
} from '@/lib/api/catalog';
import { hasManualChanges } from '@/lib/draft/style';
import { useDraft } from '@/stores/draft';

export function useDefaultStyle(hydrated: boolean): void {
  const queryClient = useQueryClient();
  const { data: styles } = useStyles();
  const { data: roomTypes } = useRoomTypes();
  const scope = useDraft((state) => state.object.scope);
  const styleId = useDraft((state) => state.styleId);
  const styleAuto = useDraft((state) => state.styleAuto);
  const firstStyleId = styles?.items[0]?.id;
  const due =
    hydrated &&
    scope === 'FULL' &&
    styleId === null &&
    styleAuto !== false &&
    firstStyleId !== undefined &&
    roomTypes !== undefined;

  useEffect(() => {
    if (!due || firstStyleId === undefined || roomTypes === undefined) {
      return;
    }
    let cancelled = false;
    queryClient
      .fetchQuery(defaultMaterialsQuery(firstStyleId))
      .then((defaults) => {
        const draft = useDraft.getState();
        if (
          !cancelled &&
          draft.styleId === null &&
          draft.styleAuto !== false &&
          draft.object.scope === 'FULL' &&
          !hasManualChanges(draft)
        ) {
          draft.selectStyle(defaults, roomTypes, true);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [due, firstStyleId, queryClient, roomTypes]);
}
