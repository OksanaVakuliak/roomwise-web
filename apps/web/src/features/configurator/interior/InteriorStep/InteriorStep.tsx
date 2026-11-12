'use client';

import { useSearchParams } from 'next/navigation';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ErrorState } from '@/components/system';
import { BottomSheet, SheetTitle, Skeleton } from '@/components/ui';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useRoomTypes } from '@/lib/api/catalog';
import { roomDisplayName, roomMetrics } from '@/lib/draft/rooms';
import type { DraftRoom } from '@/lib/draft/schema';
import { surfaceSiblings } from '@/lib/draft/surfaces';
import { area, dimension } from '@/lib/format';
import { useIsDesktop } from '@/lib/media';
import { useDraft } from '@/stores/draft';
import { usePickerSlot } from '../../shell/PickerSlot/picker-slot-context';
import { useSceneSlot } from '../../shell/SceneSlot/scene-slot-context';
import { useShowcaseSlot } from '../../shell/ShowcaseSlot/showcase-slot-context';
import { useRoomPricing } from '../../shell/use-room-pricing';
import { ChosenList } from '../ChosenList/ChosenList';
import { ProductDetail } from '../ProductDetail/ProductDetail';
import { RoomPlans } from '../RoomPlans/RoomPlans';
import { RoomPreview } from '../RoomPreview/RoomPreview';
import { Specification } from '../Specification/Specification';
import styles from './InteriorStep.module.css';

function InteriorContent() {
  const t = useTranslations('InteriorStep');
  const tSpec = useTranslations('Specification');
  const locale = useLocale();
  const format = useFormatter();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rooms = useDraft((state) => state.rooms);
  const roomTypesQuery = useRoomTypes();
  const sceneSlot = useSceneSlot();
  const pickerSlot = usePickerSlot();
  const showcaseSlot = useShowcaseSlot();
  const desktop = useIsDesktop();
  const selectProduct = useDraft((state) => state.selectProduct);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const requestedRoom = searchParams.get('room');
  const categoryId = searchParams.get('category');
  const current =
    rooms.find((room) => room.clientId === requestedRoom) ?? rooms[0] ?? null;
  const needsRedirect = current !== null && current.clientId !== requestedRoom;
  const pricing = useRoomPricing();

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
  const openPicker = useCallback(() => setPickerOpen(true), []);
  const closePicker = useCallback(() => setPickerOpen(false), []);
  const chooseFromList = useCallback(
    (roomClientId: string, id: string) => {
      navigate(
        { room: roomClientId, category: id },
        roomClientId === current?.clientId ? 'replace' : 'push',
      );
      if (!desktop) {
        setPickerOpen(true);
      }
    },
    [current?.clientId, desktop, navigate],
  );
  const roomTypeItems = roomTypesQuery.data?.items;
  const currentCategories = useMemo(
    () =>
      roomTypeItems?.find((type) => type.code === current?.roomTypeCode)
        ?.categories ?? [],
    [roomTypeItems, current?.roomTypeCode],
  );
  const chooseFromDetail = useCallback(
    (productId: string, productCategoryId: string) => {
      if (current !== null) {
        selectProduct(
          current.clientId,
          productCategoryId,
          productId,
          surfaceSiblings(currentCategories, productCategoryId),
        );
      }
      setDetailId(null);
      setPickerOpen(false);
    },
    [current, currentCategories, selectProduct],
  );
  const { data: roomTypesCatalog, refetch } = roomTypesQuery;
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
  const categories = currentCategories;
  const activeCategory =
    categories.find((category) => category.id === categoryId) ??
    categories.find((category) => category.productCount > 0) ??
    categories[0] ??
    null;
  const groups = rooms.map((room) => ({
    room,
    name: nameOf(room),
    categories:
      roomTypes.find((type) => type.code === room.roomTypeCode)?.categories ??
      [],
  }));
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
            size="mobile"
            title={roomName}
            primary={area(metrics.floorArea, locale)}
            secondary={
              <>
                <span className={styles.unbreakable}>
                  {t('wallsMobile', { walls: area(metrics.wallArea, locale) })}
                </span>
                {desktop ? (
                  <>
                    {', '}
                    <span className={styles.unbreakable}>
                      {t('perimeter', {
                        perimeter: dimension(metrics.perimeter, locale),
                      })}
                    </span>
                  </>
                ) : null}
              </>
            }
          />
        </div>
      ) : null}
      <ProductDetail
        productId={detailId}
        categoryId={activeCategory?.id ?? null}
        room={current}
        pricing={pricing}
        onChoose={chooseFromDetail}
        onClose={closeDetail}
      />
      {sceneSlot
        ? createPortal(
            <RoomPreview room={current} name={roomName} />,
            sceneSlot,
          )
        : null}
      {pickerSlot && desktop
        ? createPortal(
            <Specification
              room={current}
              pricing={pricing}
              categories={categories}
              activeCategoryId={activeCategory?.id ?? null}
              size={size}
              onCategoryChange={changeCategory}
              onOpenDetail={setDetailId}
            />,
            pickerSlot,
          )
        : null}
      {desktop ? null : (
        <BottomSheet
          open={pickerOpen}
          onClose={closePicker}
          title={tSpec('title')}
          closeLabel={t('closePicker')}
        >
          <Specification
            room={current}
            pricing={pricing}
            categories={categories}
            activeCategoryId={activeCategory?.id ?? null}
            size={size}
            hideTitle
            onCategoryChange={changeCategory}
            onChosen={closePicker}
            onOpenDetail={setDetailId}
          />
        </BottomSheet>
      )}
      {showcaseSlot
        ? createPortal(
            <ChosenList
              groups={groups}
              pricing={pricing}
              currentRoomId={current.clientId}
              activeCategoryId={activeCategory?.id ?? null}
              size={size}
              onSelect={chooseFromList}
              onOpenPicker={desktop ? undefined : openPicker}
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
