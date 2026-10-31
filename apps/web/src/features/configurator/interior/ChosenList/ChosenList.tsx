'use client';

import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { Button, ImageWithFallback, SectionHeader } from '@/components/ui';
import { useCategoryProducts } from '@/lib/api/catalog';
import { cx } from '@/lib/cx';
import type { DraftRoom } from '@/lib/draft/schema';
import { useRoomPricing } from '../use-room-pricing';
import styles from './ChosenList.module.css';

export type ChosenListCategory = {
  id: string;
  name: string;
  productCount: number;
};

export type ChosenListProps = {
  room: DraftRoom;
  categories: readonly ChosenListCategory[];
  activeCategoryId: string | null;
  size: 'mobile' | 'desktop';
  onSelectCategory: (categoryId: string) => void;
  onOpenPicker?: () => void;
};

type ChosenRowProps = {
  room: DraftRoom;
  category: ChosenListCategory;
  active: boolean;
  onSelect: (categoryId: string) => void;
};

function ChosenRow({ room, category, active, onSelect }: ChosenRowProps) {
  const t = useTranslations('ChosenList');
  const pricing = useRoomPricing();
  const selection = room.selections[category.id];
  const productId = selection?.productId ?? null;
  const disabled = selection?.disabled ?? false;
  const productsQuery = useCategoryProducts(
    productId === null ? null : category.id,
  );
  const product = productsQuery.data?.items.find(
    (item) => item.id === productId,
  );
  const line = pricing?.materialsLine(room.clientId, category.id);
  const sum =
    pricing && line?.status === 'OK' ? pricing.formatLine(line) : null;
  const select = useCallback(
    () => onSelect(category.id),
    [category.id, onSelect],
  );
  const shown = !disabled && product !== undefined;

  let status: string | null = null;
  if (disabled) {
    status = t('excluded');
  } else if (productId === null) {
    status = t('choose');
  }

  return (
    <li>
      <button
        type="button"
        className={cx(styles.row, active && styles.active)}
        aria-current={active ? 'true' : undefined}
        onClick={select}
      >
        <span className={styles.image} aria-hidden="true">
          {shown ? (
            <ImageWithFallback src={product.image?.thumb} name={product.name} />
          ) : null}
        </span>
        <span className={styles.body}>
          <span className={styles.category}>{category.name}</span>
          <span className={cx(styles.name, status && styles.muted)}>
            {status ?? product?.name}
          </span>
        </span>
        {shown && sum ? (
          <span className={`${styles.sum} num`}>{sum}</span>
        ) : null}
      </button>
    </li>
  );
}

export function ChosenList({
  room,
  categories,
  activeCategoryId,
  size,
  onSelectCategory,
  onOpenPicker,
}: ChosenListProps) {
  const t = useTranslations('ChosenList');
  const listed = categories.filter((category) => category.productCount > 0);

  return (
    <section className={styles.root}>
      <SectionHeader size={size} title={t('title')} />
      <ul className={styles.list} aria-label={t('list')}>
        {listed.map((category) => (
          <ChosenRow
            key={category.id}
            room={room}
            category={category}
            active={category.id === activeCategoryId}
            onSelect={onSelectCategory}
          />
        ))}
      </ul>
      {onOpenPicker ? (
        <Button kind="outline" onClick={onOpenPicker}>
          {t('openPicker')}
        </Button>
      ) : null}
    </section>
  );
}
