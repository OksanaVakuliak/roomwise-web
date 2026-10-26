'use client';

import {
  type KitchenType,
  type RoomTypeCode,
  roomVariables,
} from '@roomwise/calc-engine';
import { useFormatter, useTranslations } from 'next-intl';
import { type ChangeEvent, useCallback, useState } from 'react';
import {
  Button,
  IconButton,
  NumberField,
  Select,
  TextField,
} from '@/components/ui';
import {
  allowedRoomTypes,
  normalizeRoomName,
  roomDisplayName,
  roomTypeMismatch,
} from '@/lib/draft/rooms';
import { type DraftRoom, ROOM_NAME_MAX } from '@/lib/draft/schema';
import { parseDecimal, useDecimalText } from '@/lib/form';
import { useDraft } from '@/stores/draft';
import styles from './RoomEditor.module.css';
import {
  type RoomFieldErrors,
  roomDeleteDomId,
  roomFieldDomId,
} from './room-field';

export type RoomTypeOption = { code: RoomTypeCode; name: string };

export type RoomEditorProps = {
  room: DraftRoom;
  rooms: readonly DraftRoom[];
  kitchenType: KitchenType;
  roomTypes: readonly RoomTypeOption[];
  errors?: RoomFieldErrors;
  onDelete: (clientId: string) => void;
};

function floorArea(room: DraftRoom): number | null {
  if (
    room.roomTypeCode === null ||
    room.lengthM === null ||
    room.widthM === null
  ) {
    return null;
  }
  return roomVariables({
    roomTypeCode: room.roomTypeCode,
    lengthM: room.lengthM,
    widthM: room.widthM,
    heightM: room.heightM ?? 0,
    heatedFloor: room.heatedFloor,
  }).floorArea;
}

type DimensionKey = 'lengthM' | 'widthM' | 'heightM';

type DimensionFieldProps = {
  room: DraftRoom;
  field: DimensionKey;
  label: string;
  unit: string;
  error?: string;
};

function DimensionField({
  room,
  field,
  label,
  unit,
  error,
}: DimensionFieldProps) {
  const updateRoom = useDraft((state) => state.updateRoom);
  const [text, setText] = useDecimalText(room[field]);
  const { clientId } = room;
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setText(event.target.value);
      updateRoom(clientId, {
        [field]: parseDecimal(event.target.value) ?? null,
      });
    },
    [clientId, field, setText, updateRoom],
  );

  return (
    <NumberField
      id={roomFieldDomId(room.clientId, field)}
      label={label}
      unit={unit}
      error={error}
      decimal
      value={text}
      onChange={handleChange}
    />
  );
}

export function RoomEditor({
  room,
  rooms,
  kitchenType,
  roomTypes,
  errors = {},
  onDelete,
}: RoomEditorProps) {
  const t = useTranslations('ObjectStep.rooms');
  const format = useFormatter();
  const updateRoom = useDraft((state) => state.updateRoom);
  const renameRoom = useDraft((state) => state.renameRoom);
  const [nameText, setNameText] = useState(room.name ?? '');
  if (normalizeRoomName(nameText) !== (room.name ?? '')) {
    setNameText(room.name ?? '');
  }

  const mismatch = roomTypeMismatch(room, kitchenType);
  const allowed = allowedRoomTypes(kitchenType);
  const selectable = roomTypes.filter(
    (type) => allowed.includes(type.code) || type.code === room.roomTypeCode,
  );
  const typeLabel =
    roomTypes.find((type) => type.code === room.roomTypeCode)?.name ?? null;
  const ordinalLabel = typeLabel ?? t('typePlaceholder');
  const heading = roomDisplayName(rooms, room, ordinalLabel);
  const placeholder = roomDisplayName(
    rooms,
    { ...room, name: null },
    ordinalLabel,
  );
  const areaValue = floorArea(room);
  const { clientId } = room;
  const typeId = roomFieldDomId(clientId, 'roomTypeCode');

  const handleDelete = useCallback(
    () => onDelete(clientId),
    [onDelete, clientId],
  );
  const handleChangeType = useCallback(
    () => document.getElementById(typeId)?.focus(),
    [typeId],
  );
  const handleTypeChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) =>
      updateRoom(clientId, {
        roomTypeCode: event.target.value as RoomTypeCode,
      }),
    [updateRoom, clientId],
  );
  const handleNameChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setNameText(event.target.value);
      renameRoom(clientId, event.target.value);
    },
    [renameRoom, clientId],
  );

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <p className={styles.title}>{heading}</p>
        <IconButton
          id={roomDeleteDomId(room.clientId)}
          icon="trash"
          label={t('delete')}
          onClick={handleDelete}
        />
      </div>
      <div className={styles.fields}>
        <Select
          id={typeId}
          label={t('type')}
          placeholder={t('typePlaceholder')}
          value={room.roomTypeCode ?? ''}
          error={
            errors.roomTypeCode ?? (mismatch ? t('typeMismatch') : undefined)
          }
          onChange={handleTypeChange}
        >
          {selectable.map((type) => (
            <option key={type.code} value={type.code}>
              {type.name}
            </option>
          ))}
        </Select>
        <TextField
          id={roomFieldDomId(room.clientId, 'name')}
          label={t('name')}
          placeholder={placeholder}
          maxLength={ROOM_NAME_MAX}
          error={errors.name}
          value={nameText}
          onChange={handleNameChange}
        />
      </div>
      {mismatch ? (
        <div className={styles.mismatch}>
          <Button onClick={handleChangeType}>{t('changeType')}</Button>
          <Button kind="heat" onClick={handleDelete}>
            {t('deleteMismatched')}
          </Button>
        </div>
      ) : null}
      <div className={styles.dimensions}>
        <DimensionField
          room={room}
          field="lengthM"
          label={t('length')}
          unit={t('unitM')}
          error={errors.lengthM}
        />
        <DimensionField
          room={room}
          field="widthM"
          label={t('width')}
          unit={t('unitM')}
          error={errors.widthM}
        />
        <DimensionField
          room={room}
          field="heightM"
          label={t('height')}
          unit={t('unitM')}
          error={errors.heightM}
        />
      </div>
      <p className={styles.area}>
        <span className={styles.areaLabel}>{t('area')}</span>
        <span className={`${styles.areaValue} num`}>
          {areaValue === null
            ? '—'
            : t('areaValue', {
                value: format.number(areaValue, { maximumFractionDigits: 2 }),
              })}
        </span>
      </p>
    </div>
  );
}
