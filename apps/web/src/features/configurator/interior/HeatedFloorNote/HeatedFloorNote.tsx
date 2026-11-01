'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/components/ui';
import { STEP_PATHS } from '@/config/routes';
import type { DraftRoom } from '@/lib/draft/schema';
import {
  findHeatedFloorOption,
  isHeatedFloorAllowed,
} from '@/lib/engine/heated-floor';
import type { RoomPricing } from '../../shell/use-room-pricing';
import styles from './HeatedFloorNote.module.css';

export type HeatedFloorNoteProps = {
  room: DraftRoom;
  pricing: RoomPricing | null;
};

export function HeatedFloorNote({ room, pricing }: HeatedFloorNoteProps) {
  const t = useTranslations('HeatedFloorNote');
  const option = pricing
    ? findHeatedFloorOption(pricing.pricing.options)
    : null;
  if (
    !room.heatedFloor ||
    !option ||
    room.roomTypeCode === null ||
    !isHeatedFloorAllowed(option, room.roomTypeCode)
  ) {
    return null;
  }

  return (
    <p className={styles.root}>
      <span>{t('text')}</span>
      <Link href={STEP_PATHS.engineering}>{t('link')}</Link>
    </p>
  );
}
