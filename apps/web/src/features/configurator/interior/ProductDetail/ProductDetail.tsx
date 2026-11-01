'use client';

import { useTranslations } from 'next-intl';
import { type ReactNode, useCallback } from 'react';
import { ErrorState } from '@/components/system';
import {
  Button,
  Gallery,
  KeyValueGrid,
  type KeyValueItem,
  Modal,
  Skeleton,
} from '@/components/ui';
import { useProduct } from '@/lib/api/catalog';
import { ApiRequestError } from '@/lib/api/request-error';
import type { DraftRoom } from '@/lib/draft/schema';
import { productCardLine } from '@/lib/engine/card-cost';
import type { RoomPricing } from '../use-room-pricing';
import styles from './ProductDetail.module.css';

export type ProductDetailProps = {
  productId: string | null;
  categoryId: string | null;
  room: DraftRoom;
  pricing: RoomPricing | null;
  onChoose: (productId: string, categoryId: string) => void;
  onClose: () => void;
};

function BodySkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label}>
      <Skeleton variant="block" />
    </div>
  );
}

export function ProductDetail({
  productId,
  categoryId,
  room,
  pricing,
  onChoose,
  onClose,
}: ProductDetailProps) {
  const t = useTranslations('ProductDetail');
  const query = useProduct(productId);
  const { refetch } = query;
  const retry = useCallback(() => {
    void refetch();
  }, [refetch]);
  const thumbnailLabel = useCallback(
    (index: number, total: number) => t('thumbnail', { index, total }),
    [t],
  );
  const product = query.data;
  const resolvedCategory = categoryId ?? product?.categoryId ?? null;
  const choose = useCallback(() => {
    if (productId !== null && resolvedCategory !== null) {
      onChoose(productId, resolvedCategory);
    }
  }, [onChoose, productId, resolvedCategory]);
  const notFound =
    query.error instanceof ApiRequestError && query.error.status === 404;

  let body: ReactNode;
  if (notFound) {
    body = <p className={styles.gone}>{t('gone')}</p>;
  } else if (query.isError) {
    body = <ErrorState headingLevel={3} onRetry={retry} />;
  } else if (!product || pricing === null || resolvedCategory === null) {
    body = <BodySkeleton label={t('loading')} />;
  } else {
    const priced = pricing.pricing.products.find(
      (item) => item.id === product.id,
    );
    const unavailable = priced === undefined || !priced.available;
    const line = unavailable
      ? null
      : productCardLine(
          pricing.context,
          room.clientId,
          resolvedCategory,
          product.id,
        );
    const selection = room.selections[resolvedCategory];
    const picked = selection?.productId === product.id && !selection.disabled;
    const brand = [product.brand, product.manufacturer]
      .filter(Boolean)
      .join(', ');
    const specs: KeyValueItem[] = [
      { key: 'brand', label: t('brand'), value: brand },
      { key: 'size', label: t('size'), value: product.size },
      { key: 'color', label: t('color'), value: product.color },
      ...product.attributes.map((attribute, index) => ({
        key: `attribute-${index}`,
        label: attribute.name,
        value: attribute.value,
      })),
    ].filter((item) => Boolean(item.value));
    const quantity =
      line?.status === 'OK' && line.quantity !== null ? line.quantity : null;

    body = (
      <div className={styles.root}>
        {product.images.length > 0 ? (
          <Gallery
            label={t('gallery')}
            images={product.images.map((image) => ({
              src: image.card,
              name: product.name,
            }))}
            thumbnailLabel={thumbnailLabel}
          />
        ) : null}
        {product.description ? (
          <p className={styles.description}>{product.description}</p>
        ) : null}
        {specs.length > 0 ? <KeyValueGrid items={specs} /> : null}
        <dl className={styles.cost}>
          <div className={styles.row}>
            <dt>{t('unitPrice')}</dt>
            <dd className="num">
              {pricing.formatUnitPrice(
                priced?.priceCents ?? product.priceCents,
              )}{' '}
              {t(`unit.${product.unit}`)}
            </dd>
          </div>
          {line?.status === 'OK' ? (
            <>
              {quantity !== null ? (
                <div className={styles.row}>
                  <dt>{t('quantity')}</dt>
                  <dd className="num">
                    {t('quantityValue', {
                      quantity,
                      unit: product.unit,
                    })}
                  </dd>
                </div>
              ) : null}
              <div className={styles.row}>
                <dt>{t('cost')}</dt>
                <dd className="num">{pricing.formatLine(line)}</dd>
              </div>
            </>
          ) : null}
        </dl>
        <div className={styles.actions}>
          {unavailable ? (
            <p className={styles.gone}>{t('unavailable')}</p>
          ) : (
            <Button kind="fill" disabled={picked} onClick={choose}>
              {picked ? t('picked') : t('choose')}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Modal
      open={productId !== null}
      onClose={onClose}
      title={product?.name ?? t('title')}
      closeLabel={t('close')}
    >
      {body}
    </Modal>
  );
}
