'use client';

import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { ErrorState } from '@/components/system';
import { Skeleton } from '@/components/ui';
import { useRoomTypes } from '@/lib/api/catalog';
import { roomDisplayName } from '@/lib/draft/rooms';
import { useDraft } from '@/stores/draft';
import { useRoomPricing } from '../../shell/use-room-pricing';
import { RoomEngineering } from '../RoomEngineering/RoomEngineering';
import styles from './EngineeringStep.module.css';

export function EngineeringStep() {
  const t = useTranslations('EngineeringStep');
  const rooms = useDraft((state) => state.rooms);
  const roomTypesQuery = useRoomTypes();
  const pricing = useRoomPricing();
  const { refetch } = roomTypesQuery;
  const retry = useCallback(() => {
    void refetch();
  }, [refetch]);

  if (roomTypesQuery.isError) {
    return <ErrorState headingLevel={2} onRetry={retry} />;
  }

  const roomTypes = roomTypesQuery.data?.items;

  if (!roomTypes) {
    return (
      <div className={styles.root} role="status" aria-label={t('loading')}>
        <Skeleton variant="block" />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {rooms.map((room) => (
        <RoomEngineering
          key={room.clientId}
          room={room}
          name={roomDisplayName(
            rooms,
            room,
            roomTypes.find((type) => type.code === room.roomTypeCode)?.name ??
              t('roomFallback'),
          )}
          pricing={pricing}
        />
      ))}
    </div>
  );
}
