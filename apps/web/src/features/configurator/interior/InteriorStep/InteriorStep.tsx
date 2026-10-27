'use client';

import { useSearchParams } from 'next/navigation';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ErrorState } from '@/components/system';
import { SheetTitle, Skeleton } from '@/components/ui';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useRoomTypes } from '@/lib/api/catalog';
import { roomDisplayName, roomMetrics } from '@/lib/draft/rooms';
import type { DraftRoom } from '@/lib/draft/schema';
import { area, dimension } from '@/lib/format';
import { useMediaQuery } from '@/lib/media';
import { useDraft } from '@/stores/draft';
import { useSceneSlot } from '../../shell/SceneSlot/scene-slot-context';
import { useShowcaseSlot } from '../../shell/ShowcaseSlot/showcase-slot-context';
import { ProductDetail } from '../ProductDetail/ProductDetail';
import { RoomPlans } from '../RoomPlans/RoomPlans';
import { ScenePlaceholder } from '../ScenePlaceholder/ScenePlaceholder';
import { Specification } from '../Specification/Specification';
import styles from './InteriorStep.module.css';

const DESKTOP_QUERY = '(min-width: 768px)';

function InteriorContent() {
  const t = useTranslations('InteriorStep');
  const locale = useLocale();
  const format = useFormatter();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rooms = useDraft((state) => state.rooms);
  const roomTypesQuery = useRoomTypes();
  const sceneSlot = useSceneSlot();
  const showcaseSlot = useShowcaseSlot();
  const desktop = useMediaQuery(DESKTOP_QUERY);
  const selectProduct = useDraft((state) => state.selectProduct);
  const [detailId, setDetailId] = useState<string | null>(null);

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
  const closeDetail = useCallback(() => setDetailId(null), []);
  const chooseFromDetail = useCallback(
    (productId: string, productCategoryId: string) => {
      if (current !== null) {
        selectProduct(current.clientId, productCategoryId, productId);
      }
      setDetailId(null);
    },
    [current, selectProduct],
  );
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
  const size = desktop ? 'desktop' : 'mobile';
  const roomName = nameOf(current);
  const categories =
    roomTypes.find((type) => type.code === current.roomTypeCode)?.categories ??
    [];
  const activeCategory =
    categories.find((category) => category.id === categoryId) ??
    categories.find((category) => category.productCount > 0) ??
    categories[0] ??
    null;
  const items = rooms.map((room) => {
    const name = nameOf(room);
    const floorArea = roomMetrics(room)?.floorArea ?? null;
    const sizes = [room.lengthM, room.widthM]
      .filter((value) => value !== null)
      .map((value) => format.number(value))
      .join(' × ');
    return {
      clientId: room.clientId,
      name:
        desktop && floorArea !== null
          ? `${name}, ${area(floorArea, locale)}`
          : name,
      details: desktop ? `${sizes} ${t('unitM')}` : sizes,
      lengthCm: Math.round((room.lengthM ?? 0) * 100),
      widthCm: Math.round((room.widthM ?? 0) * 100),
    };
  });
  const metrics = roomMetrics(current);
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
      <RoomPlans
        label={t('switcherLabel')}
        items={items}
        value={current.clientId}
        size={size}
        onValueChange={switchRoom}
      />
      {metrics ? (
        <div className={styles.title}>
          <SheetTitle
            headingLevel={2}
            size={size}
            title={roomName}
            primary={area(metrics.floorArea, locale)}
            secondary={
              desktop
                ? t('wallsDesktop', {
                    walls: area(metrics.wallArea, locale),
                    perimeter: dimension(metrics.perimeter, locale),
                  })
                : t('wallsMobile', { walls: area(metrics.wallArea, locale) })
            }
          />
        </div>
      ) : null}
      <ProductDetail
        productId={detailId}
        categoryId={activeCategory?.id ?? null}
        room={current}
        onChoose={chooseFromDetail}
        onClose={closeDetail}
      />
      {sceneSlot && scene ? createPortal(scene, sceneSlot) : null}
      {showcaseSlot
        ? createPortal(
            <Specification
              room={current}
              categories={categories}
              activeCategoryId={activeCategory?.id ?? null}
              size={size}
              onCategoryChange={changeCategory}
              onOpenDetail={setDetailId}
            />,
            showcaseSlot,
          )
        : null}
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
