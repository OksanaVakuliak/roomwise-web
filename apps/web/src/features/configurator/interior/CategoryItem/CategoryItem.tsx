'use client';

import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { Skeleton, Toggle } from '@/components/ui';
import { useCategoryProducts } from '@/lib/api/catalog';
import { cx } from '@/lib/cx';
import styles from './CategoryItem.module.css';

export type CategoryItemProps = {
  id: string;
  position: string;
  name: string;
  productCount: number;
  productId: string | null;
  disabled: boolean;
  active: boolean;
  sum: string | null;
  onSelect: (categoryId: string) => void;
  onToggle: (categoryId: string, included: boolean) => void;
};

export function CategoryItem({
  id,
  position,
  name,
  productCount,
  productId,
  disabled,
  active,
  sum,
  onSelect,
  onToggle,
}: CategoryItemProps) {
  const t = useTranslations('CategoryList');
  const empty = productCount === 0;
  const productsQuery = useCategoryProducts(
    productId !== null && !empty ? id : null,
  );
  const product = productsQuery.data?.items.find(
    (item) => item.id === productId,
  );
  const loading = productId !== null && !empty && productsQuery.isPending;

  const handleSelect = useCallback(() => onSelect(id), [id, onSelect]);
  const handleToggle = useCallback(
    (included: boolean) => onToggle(id, included),
    [id, onToggle],
  );

  let status: string | null;
  if (empty) {
    status = t('empty');
  } else if (disabled) {
    status = t('excluded');
  } else if (product) {
    status = product.name;
  } else if (loading) {
    status = null;
  } else {
    status = t('choose');
  }
  const muted = empty || disabled;
  const prompt = !muted && !product && !loading;

  return (
    <li className={cx(styles.root, active && styles.active)}>
      <button
        type="button"
        className={styles.main}
        aria-current={active ? 'true' : undefined}
        disabled={empty}
        onClick={handleSelect}
      >
        <span className={styles.position}>{position}</span>
        <span className={styles.text}>
          <span className={styles.name}>{name}</span>
          <span
            className={cx(
              styles.status,
              muted && styles.muted,
              prompt && styles.prompt,
            )}
          >
            {status ?? <Skeleton width="60%" />}
          </span>
        </span>
        {!muted && product && sum !== null ? (
          <span className={`${styles.sum} num`}>{sum}</span>
        ) : null}
      </button>
      {empty ? null : (
        <Toggle
          label={t('toggle', { name })}
          checked={!disabled}
          onCheckedChange={handleToggle}
        />
      )}
    </li>
  );
}
