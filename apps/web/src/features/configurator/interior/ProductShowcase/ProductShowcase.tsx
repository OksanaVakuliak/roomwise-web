'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useEffectEvent, useMemo } from 'react';
import { ErrorState } from '@/components/system';
import { Button, ImageWithFallback, Skeleton, SpecItem } from '@/components/ui';
import { useCategoryProducts } from '@/lib/api/catalog';
import { ApiRequestError } from '@/lib/api/request-error';
import type { DraftRoom } from '@/lib/draft/schema';
import { productCardLine } from '@/lib/engine/card-cost';
import { useDraft } from '@/stores/draft';
import type { RoomPricing } from '../use-room-pricing';
import styles from './ProductShowcase.module.css';

type ProductCardData = NonNullable<
  ReturnType<typeof useCategoryProducts>['data']
>['items'][number];

export type SortOrder = 'server' | 'asc' | 'desc';

export type ProductShowcaseCategory = {
  id: string;
  name: string;
};

export type ProductShowcaseProps = {
  room: DraftRoom;
  pricing: RoomPricing | null;
  category: ProductShowcaseCategory;
  siblingIds?: readonly string[];
  replaces?: { surface: string; name: string };
  size: 'mobile' | 'desktop';
  order: SortOrder;
  onUnavailable: () => void;
  onChosen?: () => void;
  onOpenDetail: (productId: string) => void;
};

type ProductCardProps = {
  product: ProductCardData;
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
  size,
  room,
  categoryId,
  pricing,
  picked,
  onChoose,
  onOpenDetail,
}: ProductCardProps) {
  const t = useTranslations('ProductShowcase');
  const priced = pricing.productsById.get(product.id);
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
    <li>
      <SpecItem
        size={size}
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
        actions={
          <>
            <Button
              kind={picked ? 'outline' : 'fill'}
              className={styles.action}
              aria-label={t('chooseLabel', { name: product.name })}
              aria-pressed={picked}
              disabled={unavailable}
              onClick={choose}
            >
              {picked ? t('chosen') : t('choose')}
            </Button>
            <Button
              kind="outline"
              className={styles.action}
              aria-label={t('detailLabel', { name: product.name })}
              onClick={openDetail}
            >
              {t('detail')}
            </Button>
          </>
        }
      />
    </li>
  );
}

export function ProductShowcase({
  room,
  pricing,
  category,
  siblingIds,
  replaces,
  size,
  order,
  onUnavailable,
  onChosen,
  onOpenDetail,
}: ProductShowcaseProps) {
  const t = useTranslations('ProductShowcase');
  const query = useCategoryProducts(category.id);
  const selectProduct = useDraft((state) => state.selectProduct);
  const { refetch } = query;

  const notFound =
    query.error instanceof ApiRequestError && query.error.status === 404;
  const reportUnavailable = useEffectEvent(onUnavailable);
  useEffect(() => {
    if (notFound) {
      reportUnavailable();
    }
  }, [notFound]);

  const items = query.data?.items;
  const productsById = pricing?.productsById;
  const sorted = useMemo(() => {
    if (!items) {
      return null;
    }
    if (order === 'server') {
      return items;
    }
    const priceOf = (product: ProductCardData) =>
      productsById?.get(product.id)?.priceCents ?? product.priceCents;
    const direction = order === 'asc' ? 1 : -1;
    return [...items].sort((a, b) => direction * (priceOf(a) - priceOf(b)));
  }, [items, order, productsById]);

  const retry = useCallback(() => {
    void refetch();
  }, [refetch]);
  const choose = useCallback(
    (productId: string) => {
      selectProduct(room.clientId, category.id, productId, siblingIds);
      onChosen?.();
    },
    [category.id, onChosen, room.clientId, selectProduct, siblingIds],
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
  const excluded = selection?.disabled ?? false;

  return (
    <div className={styles.root}>
      {replaces ? (
        <p className={styles.note}>{t('replaces', replaces)}</p>
      ) : excluded ? (
        <p className={styles.hint}>{t('excluded')}</p>
      ) : null}
      <ul className={styles.list} aria-label={category.name}>
        {sorted.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
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
