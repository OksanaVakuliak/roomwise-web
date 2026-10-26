'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useId } from 'react';
import { SectionHeader } from '@/components/ui';
import type { DraftRoom } from '@/lib/draft/schema';
import { useDraft } from '@/stores/draft';
import { CategoryItem } from '../CategoryItem/CategoryItem';
import { useRoomPricing } from '../use-room-pricing';
import styles from './CategoryList.module.css';

export type CategoryListCategory = {
  id: string;
  name: string;
  productCount: number;
};

export type CategoryListProps = {
  room: DraftRoom;
  roomName: string;
  categories: readonly CategoryListCategory[];
  activeCategoryId: string | null;
  onCategoryChange: (categoryId: string | null) => void;
};

export function CategoryList({
  room,
  roomName,
  categories,
  activeCategoryId,
  onCategoryChange,
}: CategoryListProps) {
  const t = useTranslations('CategoryList');
  const headingId = useId();
  const pricing = useRoomPricing();
  const disableCategory = useDraft((state) => state.disableCategory);
  const enableCategory = useDraft((state) => state.enableCategory);
  const { clientId } = room;

  const toggle = useCallback(
    (categoryId: string, included: boolean) => {
      if (included) {
        enableCategory(clientId, categoryId);
      } else {
        disableCategory(clientId, categoryId);
      }
    },
    [clientId, disableCategory, enableCategory],
  );

  return (
    <section className={styles.root} aria-labelledby={headingId}>
      <SectionHeader
        id={headingId}
        title={t('title')}
        note={t('note', { name: roomName, count: categories.length })}
      />
      <ul className={styles.list}>
        {categories.map((category, index) => {
          const selection = room.selections[category.id];
          const line = pricing?.materialsLine(clientId, category.id);
          return (
            <CategoryItem
              key={category.id}
              id={category.id}
              position={String(index + 1)}
              name={category.name}
              productCount={category.productCount}
              productId={selection?.productId ?? null}
              disabled={selection?.disabled ?? false}
              active={category.id === activeCategoryId}
              sum={
                pricing && line?.status === 'OK'
                  ? pricing.formatLine(line)
                  : null
              }
              onSelect={onCategoryChange}
              onToggle={toggle}
            />
          );
        })}
      </ul>
    </section>
  );
}
