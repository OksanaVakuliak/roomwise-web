'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { ErrorState } from '@/components/system';
import {
  Banner,
  BottomSheet,
  Button,
  ImageWithFallback,
  SectionHeader,
  Select,
  Skeleton,
  SpecItem,
} from '@/components/ui';
import { catalogRoots, useCategoryProducts } from '@/lib/api/catalog';
import { ApiRequestError } from '@/lib/api/request-error';
import type { DraftRoom } from '@/lib/draft/schema';
import { productCardLine } from '@/lib/engine/card-cost';
import { useDraft } from '@/stores/draft';
import { useShowcaseSlot } from '../../shell/ShowcaseSlot/showcase-slot-context';
import { type RoomPricing, useRoomPricing } from '../use-room-pricing';
import styles from './ProductShowcase.module.css';

type ProductCardData = NonNullable<
  ReturnType<typeof useCategoryProducts>['data']
>['items'][number];

type SortOrder = 'server' | 'asc' | 'desc';

export type ProductShowcaseCategory = {
  id: string;
  name: string;
  position: number;
};

export type ProductShowcaseProps = {
  room: DraftRoom;
  category: ProductShowcaseCategory | null;
  placement: 'sheet' | 'zone';
  onCategoryChange: (categoryId: string | null) => void;
  onOpenDetail: (productId: string) => void;
};

type BodyProps = {
  room: DraftRoom;
  category: ProductShowcaseCategory;
  placement: 'sheet' | 'zone';
  onSelected: () => void;
  onUnavailable: () => void;
  onOpenDetail: (productId: string) => void;
};

type ProductCardProps = {
  product: ProductCardData;
  position: string;
  size: 'mobile' | 'desktop';
  room: DraftRoom;
  categoryId: string;
  pricing: RoomPricing;
  picked: boolean;
  onChoose: (productId: string) => void;
  onOpenDetail: (productId: string) => void;
};

function ProductCard({
  product,
  position,
  size,
  room,
  categoryId,
  pricing,
  picked,
  onChoose,
  onOpenDetail,
}: ProductCardProps) {
  const t = useTranslations('ProductShowcase');
  const priced = pricing.pricing.products.find(
    (item) => item.id === product.id,
  );
  const unavailable = priced === undefined || !priced.available;
  const line = unavailable
    ? null
    : productCardLine(pricing.context, room.clientId, categoryId, product.id);
  const cost = line?.status === 'OK' ? pricing.formatLine(line) : undefined;
  const brand = [product.brand, product.manufacturer]
    .filter(Boolean)
    .join(', ');
  const choose = useCallback(
    () => onChoose(product.id),
    [onChoose, product.id],
  );
  const openDetail = useCallback(
    () => onOpenDetail(product.id),
    [onOpenDetail, product.id],
  );

  return (
    <li className={styles.item}>
      <SpecItem
        size={size}
        position={position}
        image={
          <ImageWithFallback src={product.image?.thumb} name={product.name} />
        }
        name={product.name}
        brand={brand}
        dimensions={product.size}
        color={product.color}
        unavailable={unavailable}
        unavailableLabel={t('unavailable')}
        selected={picked}
        pickedLabel={t('picked')}
        price={pricing.formatUnitPrice(
          priced?.priceCents ?? product.priceCents,
        )}
        unit={t(`unit.${product.unit}`)}
        roomCost={cost}
        roomCostLabel={cost ? t('forRoom') : undefined}
        onSelect={choose}
      />
      <Button
        kind="outline"
        className={styles.detail}
        aria-label={t('detailLabel', { name: product.name })}
        onClick={openDetail}
      >
        {t('detail')}
      </Button>
    </li>
  );
}

const SORT_ORDERS: readonly SortOrder[] = ['server', 'asc', 'desc'];

function ShowcaseBody({
  room,
  category,
  placement,
  onSelected,
  onUnavailable,
  onOpenDetail,
}: BodyProps) {
  const t = useTranslations('ProductShowcase');
  const query = useCategoryProducts(category.id);
  const pricing = useRoomPricing();
  const selectProduct = useDraft((state) => state.selectProduct);
  const [order, setOrder] = useState<SortOrder>('server');
  const { refetch } = query;

  const notFound =
    query.error instanceof ApiRequestError && query.error.status === 404;
  useEffect(() => {
    if (notFound) {
      onUnavailable();
    }
  }, [notFound, onUnavailable]);

  const items = query.data?.items;
  const sorted = useMemo(() => {
    if (!items) {
      return null;
    }
    const entries = items.map((product, index) => ({ product, index }));
    if (order === 'asc') {
      entries.sort((a, b) => a.product.priceCents - b.product.priceCents);
    } else if (order === 'desc') {
      entries.sort((a, b) => b.product.priceCents - a.product.priceCents);
    }
    return entries;
  }, [items, order]);

  const changeOrder = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) =>
      setOrder(event.target.value as SortOrder),
    [],
  );
  const retry = useCallback(() => {
    void refetch();
  }, [refetch]);
  const choose = useCallback(
    (productId: string) => {
      selectProduct(room.clientId, category.id, productId);
      onSelected();
    },
    [category.id, onSelected, room.clientId, selectProduct],
  );

  if (notFound) {
    return null;
  }

  if (query.isError) {
    return <ErrorState headingLevel={3} onRetry={retry} />;
  }

  if (!sorted || pricing === null) {
    return (
      <div className={styles.root} role="status" aria-label={t('loading')}>
        <Skeleton variant="block" />
      </div>
    );
  }

  const selection = room.selections[category.id];
  const size = placement === 'zone' ? 'desktop' : 'mobile';

  return (
    <div className={styles.root}>
      {placement === 'zone' ? (
        <SectionHeader
          title={t('title')}
          note={t('note', { name: category.name, count: sorted.length })}
        />
      ) : null}
      <Select
        label={t('sortLabel')}
        value={order}
        onChange={changeOrder}
        className={styles.sort}
      >
        {SORT_ORDERS.map((value) => (
          <option key={value} value={value}>
            {t(`sort.${value}`)}
          </option>
        ))}
      </Select>
      <ul className={styles.list} aria-label={category.name}>
        {sorted.map(({ product, index }) => (
          <ProductCard
            key={product.id}
            product={product}
            position={`${category.position}.${index + 1}`}
            size={size}
            room={room}
            categoryId={category.id}
            pricing={pricing}
            picked={selection?.productId === product.id && !selection.disabled}
            onChoose={choose}
            onOpenDetail={onOpenDetail}
          />
        ))}
      </ul>
    </div>
  );
}

export function ProductShowcase({
  room,
  category,
  placement,
  onCategoryChange,
  onOpenDetail,
}: ProductShowcaseProps) {
  const t = useTranslations('ProductShowcase');
  const queryClient = useQueryClient();
  const slot = useShowcaseSlot();
  const [unavailable, setUnavailable] = useState(false);

  const close = useCallback(() => onCategoryChange(null), [onCategoryChange]);
  const dismiss = useCallback(() => setUnavailable(false), []);
  const handleUnavailable = useCallback(() => {
    setUnavailable(true);
    void queryClient.invalidateQueries({ queryKey: [catalogRoots.roomTypes] });
    void queryClient.invalidateQueries({ queryKey: [catalogRoots.products] });
    onCategoryChange(null);
  }, [onCategoryChange, queryClient]);

  const body = category ? (
    <ShowcaseBody
      key={category.id}
      room={room}
      category={category}
      placement={placement}
      onSelected={placement === 'sheet' ? close : noop}
      onUnavailable={handleUnavailable}
      onOpenDetail={onOpenDetail}
    />
  ) : null;

  return (
    <>
      {unavailable ? (
        <Banner
          variant="warning"
          onDismiss={dismiss}
          dismissLabel={t('dismiss')}
        >
          {t('categoryGone')}
        </Banner>
      ) : null}
      {placement === 'sheet' ? (
        <BottomSheet
          open={category !== null}
          title={category?.name ?? t('title')}
          closeLabel={t('close')}
          onClose={close}
        >
          {body}
        </BottomSheet>
      ) : slot && body ? (
        createPortal(body, slot)
      ) : null}
    </>
  );
}

function noop() {
  return undefined;
}
