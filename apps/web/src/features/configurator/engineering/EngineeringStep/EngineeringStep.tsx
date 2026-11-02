'use client';

import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { ErrorState } from '@/components/system';
import { Skeleton } from '@/components/ui';
import { useEngineering, useRoomTypes } from '@/lib/api/catalog';
import { roomDisplayName } from '@/lib/draft/rooms';
import { useDraft } from '@/stores/draft';
import { checkPricingData, usePricingData } from '@/stores/pricing-data';
import { useStepValidation } from '../../shell/StepValidation/step-validation-context';
import { useRoomPricing } from '../../shell/use-room-pricing';
import { OptionList } from '../OptionList/OptionList';
import { firstInvalidQuantityId } from '../option-quantity';
import { PackageList } from '../PackageList/PackageList';
import { RoomEngineering } from '../RoomEngineering/RoomEngineering';
import styles from './EngineeringStep.module.css';

export function EngineeringStep() {
  const t = useTranslations('EngineeringStep');
  const rooms = useDraft((state) => state.rooms);
  const roomTypesQuery = useRoomTypes();
  const engineeringQuery = useEngineering();
  const pricing = useRoomPricing();
  const pricingFailed = usePricingData((state) => state.status === 'error');
  const { refetch } = roomTypesQuery;
  const { refetch: refetchEngineering } = engineeringQuery;
  const retry = useCallback(() => {
    void refetch();
    void refetchEngineering();
  }, [refetch, refetchEngineering]);

  useStepValidation(() => {
    const options = usePricingData.getState().data?.options;
    return options
      ? firstInvalidQuantityId(options, useDraft.getState().options)
      : null;
  });

  if (roomTypesQuery.isError || engineeringQuery.isError) {
    return <ErrorState headingLevel={2} onRetry={retry} />;
  }

  if (!pricing && pricingFailed) {
    return <ErrorState headingLevel={2} onRetry={checkPricingData} />;
  }

  const roomTypes = roomTypesQuery.data?.items;

  if (!roomTypes || !engineeringQuery.data || !pricing) {
    return (
      <div className={styles.root} role="status" aria-label={t('loading')}>
        <Skeleton variant="block" />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <PackageList pricing={pricing} />
      <OptionList
        kind="ENGINEERING"
        title={t('apartmentTitle')}
        pricing={pricing}
      />
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
      <OptionList
        kind="ADDITIONAL"
        title={t('additionalTitle')}
        pricing={pricing}
      />
    </div>
  );
}
