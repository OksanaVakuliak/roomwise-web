'use client';

import { useId } from 'react';
import { SectionHeader } from '@/components/ui';
import type { DraftRoom } from '@/lib/draft/schema';
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
  const headingId = useId();

  return (
    <section className={styles.root} aria-labelledby={headingId}>
      <SectionHeader id={headingId} level={2} size="mobile" title={name} />
      <div className={styles.list}>
        <HeatedFloorSwitch room={room} pricing={pricing} />
        <RoomOptions room={room} pricing={pricing} />
      </div>
    </section>
  );
}
