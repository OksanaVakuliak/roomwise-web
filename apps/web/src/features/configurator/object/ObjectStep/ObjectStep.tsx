'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { Banner, Icon, RoomPlan } from '@/components/ui';
import { useRoomTypes } from '@/lib/api/catalog';
import { roomDisplayName } from '@/lib/draft/rooms';
import { useDraft } from '@/stores/draft';
import { usePricingData } from '@/stores/pricing-data';
import { useSceneSlot } from '../../shell/SceneSlot/scene-slot-context';
import { useStepValidation } from '../../shell/StepValidation/step-validation-context';
import { ObjectForm, type ObjectFormErrors } from '../ObjectForm/ObjectForm';
import { roomFieldDomId } from '../RoomEditor/room-field';
import { RoomList } from '../RoomList/RoomList';
import styles from './ObjectStep.module.css';
import {
  type FieldMessage,
  ROOMS_MESSAGE_DOM_ID,
  validateObject,
} from './validate-object';

type PlanItemProps = {
  clientId: string;
  name: string;
  details: string;
  lengthM: number;
  widthM: number;
};

function PlanItem({ clientId, name, details, lengthM, widthM }: PlanItemProps) {
  const focusRoom = useCallback(
    () => document.getElementById(roomFieldDomId(clientId, 'lengthM'))?.focus(),
    [clientId],
  );

  return (
    <RoomPlan
      name={name}
      details={details}
      lengthCm={lengthM * 100}
      widthCm={widthM * 100}
      onClick={focusRoom}
    />
  );
}

export function ObjectStep() {
  const t = useTranslations('ObjectStep');
  const format = useFormatter();
  const object = useDraft((state) => state.object);
  const rooms = useDraft((state) => state.rooms);
  const limits = usePricingData((state) => state.data?.limits ?? null);
  const roomTypes = useRoomTypes().data?.items;
  const sceneSlot = useSceneSlot();
  const [attempted, setAttempted] = useState(false);

  const validation = useMemo(
    () => (limits ? validateObject({ object, rooms }, limits) : null),
    [object, rooms, limits],
  );

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
    return [{ room, lengthM, widthM }];
  });

  const plan =
    plannedRooms.length === 0 ? null : (
      <ul className={styles.plans} aria-label={t('plan')}>
        {plannedRooms.map(({ room, lengthM, widthM }) => {
          const typeLabel =
            roomTypes?.find((type) => type.code === room.roomTypeCode)?.name ??
            t('rooms.typePlaceholder');
          return (
            <li key={room.clientId} className={styles.plan}>
              <PlanItem
                clientId={room.clientId}
                name={roomDisplayName(rooms, room, typeLabel)}
                details={`${format.number(lengthM)} × ${format.number(widthM)} ${t('rooms.unitM')}`}
                lengthM={lengthM}
                widthM={widthM}
              />
            </li>
          );
        })}
      </ul>
    );

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
      {sceneSlot && plan ? createPortal(plan, sceneSlot) : null}
    </div>
  );
}
