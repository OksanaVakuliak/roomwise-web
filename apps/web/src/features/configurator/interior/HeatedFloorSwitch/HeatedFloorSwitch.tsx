'use client';

import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { SwitchRow } from '@/components/ui';
import type { DraftRoom } from '@/lib/draft/schema';
import {
  findHeatedFloorOption,
  isHeatedFloorAllowed,
} from '@/lib/engine/heated-floor';
import { useDraft } from '@/stores/draft';
import type { RoomPricing } from '../use-room-pricing';

export type HeatedFloorSwitchProps = {
  room: DraftRoom;
  pricing: RoomPricing | null;
};

export function HeatedFloorSwitch({ room, pricing }: HeatedFloorSwitchProps) {
  const t = useTranslations('HeatedFloorSwitch');
  const setHeatedFloor = useDraft((state) => state.setHeatedFloor);
  const { clientId } = room;
  const handleChange = useCallback(
    (on: boolean) => setHeatedFloor(clientId, on),
    [clientId, setHeatedFloor],
  );

  const option = pricing
    ? findHeatedFloorOption(pricing.pricing.options)
    : null;
  if (
    !option ||
    room.roomTypeCode === null ||
    !isHeatedFloorAllowed(option, room.roomTypeCode)
  ) {
    return null;
  }

  return (
    <SwitchRow
      title={t('title')}
      description={t('description')}
      checked={room.heatedFloor}
      onCheckedChange={handleChange}
    />
  );
}
