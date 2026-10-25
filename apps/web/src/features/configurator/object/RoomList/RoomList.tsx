'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Button, ConfirmDialog, Icon } from '@/components/ui';
import { useRoomTypes } from '@/lib/api/catalog';
import { needsDeleteConfirm } from '@/lib/draft/rooms';
import { useDraft } from '@/stores/draft';
import { RoomEditor, type RoomTypeOption } from '../RoomEditor/RoomEditor';
import {
  type RoomFieldErrors,
  roomDeleteDomId,
  roomFieldDomId,
} from '../RoomEditor/room-field';
import styles from './RoomList.module.css';

export type RoomListProps = {
  errors?: Partial<Record<string, RoomFieldErrors>>;
};

export function RoomList({ errors = {} }: RoomListProps) {
  const t = useTranslations('ObjectStep.rooms');
  const rooms = useDraft((state) => state.rooms);
  const kitchenType = useDraft((state) => state.object.kitchenType);
  const addRoom = useDraft((state) => state.addRoom);
  const removeRoom = useDraft((state) => state.removeRoom);
  const roomTypesQuery = useRoomTypes();
  const roomTypes: RoomTypeOption[] = roomTypesQuery.data?.items ?? [];
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const pendingFocus = useRef<string | null>(null);
  const titleId = useId();
  const addId = useId();

  useEffect(() => {
    if (pendingFocus.current === null) {
      return;
    }
    const target = document.getElementById(pendingFocus.current);
    pendingFocus.current = null;
    target?.focus();
  });

  const handleAdd = useCallback(() => {
    const clientId = addRoom();
    if (clientId !== null) {
      pendingFocus.current = roomFieldDomId(clientId, 'roomTypeCode');
    }
  }, [addRoom]);

  const performDelete = useCallback(
    (clientId: string) => {
      const { rooms: current } = useDraft.getState();
      const index = current.findIndex((room) => room.clientId === clientId);
      const next = current[index + 1] ?? current[index - 1];
      pendingFocus.current = next ? roomDeleteDomId(next.clientId) : addId;
      removeRoom(clientId);
      setPendingDelete(null);
    },
    [addId, removeRoom],
  );

  const requestDelete = useCallback(
    (clientId: string) => {
      if (needsDeleteConfirm(useDraft.getState(), clientId)) {
        setPendingDelete(clientId);
        return;
      }
      performDelete(clientId);
    },
    [performDelete],
  );

  const handleConfirm = useCallback(() => {
    if (pendingDelete !== null) {
      performDelete(pendingDelete);
    }
  }, [pendingDelete, performDelete]);

  const handleCancel = useCallback(() => setPendingDelete(null), []);

  return (
    <section className={styles.root} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.title}>
        {t('title')}
      </h2>
      {rooms.length === 0 ? (
        <p className={styles.empty}>{t('empty')}</p>
      ) : (
        <ul className={styles.list} aria-labelledby={titleId}>
          {rooms.map((room) => (
            <li key={room.clientId} className={styles.item}>
              <RoomEditor
                room={room}
                rooms={rooms}
                kitchenType={kitchenType}
                roomTypes={roomTypes}
                errors={errors[room.clientId]}
                onDelete={requestDelete}
              />
            </li>
          ))}
        </ul>
      )}
      <Button id={addId} className={styles.add} onClick={handleAdd}>
        <Icon name="plus" size="sm" />
        {t('add')}
      </Button>
      <ConfirmDialog
        open={pendingDelete !== null}
        tone="danger"
        title={t('deleteTitle')}
        description={t('deleteMessage')}
        confirmLabel={t('deleteConfirm')}
        cancelLabel={t('deleteCancel')}
        closeLabel={t('deleteClose')}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </section>
  );
}
