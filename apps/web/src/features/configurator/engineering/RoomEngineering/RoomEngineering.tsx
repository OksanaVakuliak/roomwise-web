'use client';

import { useTranslations } from 'next-intl';
import { useId } from 'react';
import { SectionHeader } from '@/components/ui';
import { useEngineering } from '@/lib/api/catalog';
import type { DraftRoom } from '@/lib/draft/schema';
import { isHeatedFloorOffered } from '@/lib/engine/heated-floor';
import { useRoomOptions } from '../../shell/use-room-options';
import type { RoomPricing } from '../../shell/use-room-pricing';
import { HeatedFloorSwitch } from '../HeatedFloorSwitch/HeatedFloorSwitch';
import { RoomOptions } from '../RoomOptions/RoomOptions';
import styles from './RoomEngineering.module.css';

export type RoomEngineeringProps = {
  room: DraftRoom;
  name: string;
  pricing: RoomPricing | null;
};

export function RoomEngineering({ room, name, pricing }: RoomEngineeringProps) {
  const t = useTranslations('RoomEngineering');
  const headingId = useId();
  const options = useRoomOptions(room);
  const catalogLoaded = useEngineering().data !== undefined;
  const empty =
    catalogLoaded &&
    options.length === 0 &&
    !(
      pricing &&
      isHeatedFloorOffered(pricing.pricing.options, room.roomTypeCode)
    );

  return (
    <section className={styles.root} aria-labelledby={headingId}>
      <SectionHeader id={headingId} level={2} size="mobile" title={name} />
      {empty ? (
        <p className={styles.empty}>{t('empty')}</p>
      ) : (
        <div className={styles.list}>
          <HeatedFloorSwitch room={room} pricing={pricing} />
          <RoomOptions room={room} pricing={pricing} />
        </div>
      )}
    </section>
  );
}
