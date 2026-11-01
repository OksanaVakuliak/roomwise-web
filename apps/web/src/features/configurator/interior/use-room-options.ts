'use client';

import { useMemo } from 'react';
import { useEngineering } from '@/lib/api/catalog';
import type { DraftRoom } from '@/lib/draft/schema';
import { roomOptionsFor } from '@/lib/engine/room-options';

export function useRoomOptions(room: DraftRoom) {
  const engineering = useEngineering();
  const options = engineering.data?.options;
  return useMemo(
    () => roomOptionsFor(options ?? [], room.roomTypeCode),
    [options, room.roomTypeCode],
  );
}
