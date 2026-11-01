'use client';

import { useMemo } from 'react';
import { useEngineering } from '@/lib/api/catalog';
import type { DraftRoom } from '@/lib/draft/schema';
import { roomOptionsFor } from '@/lib/engine/room-options';
import { useDraft } from '@/stores/draft';

export function useRoomOptions(room: DraftRoom) {
  const engineering = useEngineering();
  const options = engineering.data?.options;
  return useMemo(
    () => roomOptionsFor(options ?? [], room.roomTypeCode),
    [options, room.roomTypeCode],
  );
}

export function useChosenRoomOptions(room: DraftRoom) {
  const available = useRoomOptions(room);
  const chosen = useDraft((state) => state.options);
  return useMemo(
    () =>
      available.filter((option) =>
        (chosen[option.id]?.roomClientIds ?? []).includes(room.clientId),
      ),
    [available, chosen, room.clientId],
  );
}
