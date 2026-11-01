'use client';

import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { SwitchRow } from '@/components/ui';
import type { DraftRoom } from '@/lib/draft/schema';
import { heatedFloorRoomLine } from '@/lib/engine/card-cost';
import { isHeatedFloorOffered } from '@/lib/engine/heated-floor';
import { useDraft } from '@/stores/draft';
import type { RoomPricing } from '../../shell/use-room-pricing';

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

  if (
    !pricing ||
    !isHeatedFloorOffered(pricing.pricing.options, room.roomTypeCode)
  ) {
    return null;
  }

  const line = heatedFloorRoomLine(pricing.context, clientId);
  const cost = line?.status === 'OK' ? pricing.formatLine(line) : undefined;
  const description = t('description');

  return (
    <SwitchRow
      title={t('title')}
      description={cost ? t('priced', { description, cost }) : description}
      checked={room.heatedFloor}
      onCheckedChange={handleChange}
    />
  );
}
