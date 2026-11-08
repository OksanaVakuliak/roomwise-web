'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { Banner, Icon } from '@/components/ui';
import { useRoomTypes } from '@/lib/api/catalog';
import { roomDisplayName } from '@/lib/draft/rooms';
import { runEstimate } from '@/lib/engine/run-estimate';
import { useIsDesktop } from '@/lib/media';
import { useDraft, useDraftValue } from '@/stores/draft';
import { usePricingData } from '@/stores/pricing-data';
import { useShowcaseSlot } from '../../shell/ShowcaseSlot/showcase-slot-context';
import { useStepValidation } from '../../shell/StepValidation/step-validation-context';
import { ApartmentPlan } from '../ApartmentPlan/ApartmentPlan';
import { ObjectForm, type ObjectFormErrors } from '../ObjectForm/ObjectForm';
import { RoomList } from '../RoomList/RoomList';
import styles from './ObjectStep.module.css';
import {
  type FieldMessage,
  ROOMS_MESSAGE_DOM_ID,
  validateObject,
} from './validate-object';

export function ObjectStep() {
  const t = useTranslations('ObjectStep');
  const object = useDraft((state) => state.object);
  const rooms = useDraft((state) => state.rooms);
  const draft = useDraftValue();
  const revision = useDraft((state) => state.revision);
  const pricing = usePricingData((state) => state.data);
  const pricingVersion = usePricingData((state) => state.version);
  const limits = pricing?.limits ?? null;
  const roomTypes = useRoomTypes().data?.items;
  const showcaseSlot = useShowcaseSlot();
  const desktop = useIsDesktop();
  const [attempted, setAttempted] = useState(false);

  const validation = useMemo(
    () => (limits ? validateObject({ object, rooms }, limits) : null),
    [object, rooms, limits],
  );

  const missingSqm = useMemo(() => {
    if (pricing === null || pricingVersion === null) {
      return null;
    }
    const { estimate } = runEstimate({
      draft,
      draftRevision: revision,
      pricing,
      pricingVersion,
      currency: 'UAH',
    });
    const warning = estimate?.warnings.find(
      (item) => item.code === 'ROOMS_AREA_BELOW_TOTAL',
    );
    const missing = warning?.params?.missingSqm;
    return typeof missing === 'number' ? missing : null;
  }, [draft, revision, pricing, pricingVersion]);

  useStepValidation(() => {
    if (!limits) {
      return null;
    }
    flushSync(() => setAttempted(true));
    return validateObject(useDraft.getState(), limits).firstInvalidId;
  });

  const translate = useCallback(
    (message: FieldMessage): string =>
      'params' in message
        ? t(`validation.${message.key}`, message.params)
        : t(`validation.${message.key}`),
    [t],
  );

  const shown = attempted ? validation : null;
  const objectErrors: ObjectFormErrors = {};
  for (const [field, message] of Object.entries(shown?.object ?? {})) {
    objectErrors[field as keyof ObjectFormErrors] = translate(message);
  }
  const roomErrors = Object.fromEntries(
    Object.entries(shown?.rooms ?? {}).map(([clientId, messages]) => [
      clientId,
      Object.fromEntries(
        Object.entries(messages).map(([field, message]) => [
          field,
          translate(message),
        ]),
      ),
    ]),
  );
  const roomsMessage = shown?.roomsMessage ?? null;
  const excess = validation?.excessAreaSqm ?? null;

  const plannedRooms = rooms.flatMap((room) => {
    const { lengthM, widthM } = room;
    const side = limits?.roomSideM;
    if (
      !side ||
      lengthM === null ||
      widthM === null ||
      lengthM < side.min ||
      lengthM > side.max ||
      widthM < side.min ||
      widthM > side.max
    ) {
      return [];
    }
    const typeLabel =
      roomTypes?.find((type) => type.code === room.roomTypeCode)?.name ??
      t('rooms.typePlaceholder');
    return [
      {
        clientId: room.clientId,
        name: roomDisplayName(rooms, room, typeLabel),
        lengthM,
        widthM,
      },
    ];
  });

  return (
    <div className={styles.root}>
      <ObjectForm errors={objectErrors} />
      <RoomList errors={roomErrors} />
      {roomsMessage ? (
        <p id={ROOMS_MESSAGE_DOM_ID} tabIndex={-1} className={styles.error}>
          <Icon name="warning" size="sm" />
          {translate(roomsMessage)}
        </p>
      ) : null}
      {excess === null ? null : (
        <Banner variant="warning">
          {t('validation.roomsExceedTotal', { difference: excess })}
        </Banner>
      )}
      {missingSqm === null ? null : (
        <Banner variant="info">
          {t('validation.roomsBelowTotal', { missing: missingSqm })}
        </Banner>
      )}
      {showcaseSlot
        ? createPortal(
            <ApartmentPlan
              rooms={plannedRooms}
              size={desktop ? 'desktop' : 'mobile'}
            />,
            showcaseSlot,
          )
        : null}
    </div>
  );
}
