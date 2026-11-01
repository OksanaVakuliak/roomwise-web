'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useId } from 'react';
import { SectionHeader, SwitchRow } from '@/components/ui';
import type { DraftRoom } from '@/lib/draft/schema';
import { optionRoomLine } from '@/lib/engine/card-cost';
import { useDraft } from '@/stores/draft';
import { useRoomOptions } from '../use-room-options';
import type { RoomPricing } from '../use-room-pricing';
import styles from './RoomOptions.module.css';

export type RoomOptionsProps = {
  room: DraftRoom;
  pricing: RoomPricing | null;
};

type OptionRowProps = {
  room: DraftRoom;
  pricing: RoomPricing | null;
  optionId: string;
  name: string;
};

function OptionRow({ room, pricing, optionId, name }: OptionRowProps) {
  const toggle = useDraft((state) => state.toggleRoomOption);
  const chosen = useDraft((state) =>
    (state.options[optionId]?.roomClientIds ?? []).includes(room.clientId),
  );
  const change = useCallback(
    () => toggle(optionId, room.clientId),
    [optionId, room.clientId, toggle],
  );
  const line = pricing
    ? optionRoomLine(pricing.context, room.clientId, optionId)
    : null;
  const cost =
    pricing && line?.status === 'OK' ? pricing.formatLine(line) : undefined;

  return (
    <li>
      <SwitchRow
        title={name}
        description={cost}
        checked={chosen}
        onCheckedChange={change}
      />
    </li>
  );
}

export function RoomOptions({ room, pricing }: RoomOptionsProps) {
  const t = useTranslations('RoomOptions');
  const headingId = useId();
  const options = useRoomOptions(room);

  if (options.length === 0) {
    return null;
  }

  return (
    <section className={styles.root} aria-labelledby={headingId}>
      <SectionHeader
        id={headingId}
        level={3}
        size="mobile"
        title={t('title')}
      />
      <ul className={styles.list}>
        {options.map((option) => (
          <OptionRow
            key={option.id}
            room={room}
            pricing={pricing}
            optionId={option.id}
            name={option.name}
          />
        ))}
      </ul>
    </section>
  );
}
