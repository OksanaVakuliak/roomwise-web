'use client';

import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Suspense, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ErrorState } from '@/components/system';
import { Skeleton } from '@/components/ui';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useRoomTypes } from '@/lib/api/catalog';
import { roomDisplayName } from '@/lib/draft/rooms';
import type { DraftRoom } from '@/lib/draft/schema';
import { useMediaQuery } from '@/lib/media';
import { useDraft } from '@/stores/draft';
import { useSceneSlot } from '../../shell/SceneSlot/scene-slot-context';
import { CategoryList } from '../CategoryList/CategoryList';
import { ProductShowcase } from '../ProductShowcase/ProductShowcase';
import { RoomSwitcher } from '../RoomSwitcher/RoomSwitcher';
import { ScenePlaceholder } from '../ScenePlaceholder/ScenePlaceholder';
import styles from './InteriorStep.module.css';

const DESKTOP_QUERY = '(min-width: 768px)';

function InteriorContent() {
  const t = useTranslations('InteriorStep');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rooms = useDraft((state) => state.rooms);
  const roomTypesQuery = useRoomTypes();
  const sceneSlot = useSceneSlot();
  const desktop = useMediaQuery(DESKTOP_QUERY);

  const requestedRoom = searchParams.get('room');
  const categoryId = searchParams.get('category');
  const current =
    rooms.find((room) => room.clientId === requestedRoom) ?? rooms[0] ?? null;
  const needsRedirect = current !== null && current.clientId !== requestedRoom;

  const navigate = useCallback(
    (changes: Record<string, string | null>, mode: 'push' | 'replace') => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value === null) {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      }
      router[mode](`${pathname}?${next.toString()}`);
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (needsRedirect) {
      navigate({ room: current.clientId }, 'replace');
    }
  }, [current, navigate, needsRedirect]);

  const switchRoom = useCallback(
    (clientId: string) => navigate({ room: clientId }, 'push'),
    [navigate],
  );
  const changeCategory = useCallback(
    (id: string | null) => navigate({ category: id }, 'replace'),
    [navigate],
  );
  const openDetail = useCallback(() => undefined, []);
  const { refetch } = roomTypesQuery;
  const retry = useCallback(() => {
    void refetch();
  }, [refetch]);

  if (roomTypesQuery.isError) {
    return <ErrorState headingLevel={2} onRetry={retry} />;
  }

  const roomTypes = roomTypesQuery.data?.items;

  if (!roomTypes || current === null) {
    return (
      <div className={styles.root} role="status" aria-label={t('loading')}>
        <Skeleton variant="block" />
      </div>
    );
  }

  const nameOf = (room: DraftRoom) =>
    roomDisplayName(
      rooms,
      room,
      roomTypes.find((type) => type.code === room.roomTypeCode)?.name ??
        t('roomFallback'),
    );
  const items = rooms.map((room) => ({
    clientId: room.clientId,
    label: nameOf(room),
  }));
  const roomName = nameOf(current);
  const categories =
    roomTypes.find((type) => type.code === current.roomTypeCode)?.categories ??
    [];
  const selectable = categories.filter((category) => category.productCount > 0);
  const activeIndex = categories.findIndex(
    (category) => category.id === categoryId && category.productCount > 0,
  );
  const fallback = desktop ? selectable[0] : undefined;
  const activeEntry = activeIndex >= 0 ? categories[activeIndex] : fallback;
  const activeCategory = activeEntry
    ? {
        id: activeEntry.id,
        name: activeEntry.name,
        position: categories.indexOf(activeEntry) + 1,
      }
    : null;
  const { lengthM, widthM, heightM } = current;
  const scene =
    lengthM === null || widthM === null || heightM === null ? null : (
      <ScenePlaceholder
        name={roomName}
        lengthM={lengthM}
        widthM={widthM}
        heightM={heightM}
      />
    );

  return (
    <div className={styles.root}>
      <RoomSwitcher
        label={t('switcherLabel')}
        items={items}
        value={current.clientId}
        onValueChange={switchRoom}
      >
        <ProductShowcase
          room={current}
          category={activeCategory}
          placement={desktop ? 'zone' : 'sheet'}
          onCategoryChange={changeCategory}
          onOpenDetail={openDetail}
        />
        <CategoryList
          room={current}
          roomName={roomName}
          categories={categories}
          activeCategoryId={activeCategory?.id ?? null}
          onCategoryChange={changeCategory}
        />
      </RoomSwitcher>
      {sceneSlot && scene ? createPortal(scene, sceneSlot) : null}
    </div>
  );
}

function InteriorFallback() {
  const t = useTranslations('InteriorStep');

  return (
    <div className={styles.root} role="status" aria-label={t('loading')}>
      <Skeleton variant="block" />
    </div>
  );
}

export function InteriorStep() {
  return (
    <Suspense fallback={<InteriorFallback />}>
      <InteriorContent />
    </Suspense>
  );
}
