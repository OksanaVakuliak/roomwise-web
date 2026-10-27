'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useCallback, useId, useState } from 'react';
import {
  Banner,
  EmptyState,
  SectionHeader,
  SwitchRow,
  Tab,
  TabPanel,
  Tabs,
} from '@/components/ui';
import { catalogRoots, useCategoryProducts } from '@/lib/api/catalog';
import type { DraftRoom } from '@/lib/draft/schema';
import { useDraft } from '@/stores/draft';
import { ProductShowcase } from '../ProductShowcase/ProductShowcase';
import { useRoomPricing } from '../use-room-pricing';
import styles from './Specification.module.css';

export type SpecificationCategory = {
  id: string;
  name: string;
  productCount: number;
};

export type SpecificationProps = {
  room: DraftRoom;
  categories: readonly SpecificationCategory[];
  activeCategoryId: string | null;
  size: 'mobile' | 'desktop';
  onCategoryChange: (categoryId: string | null) => void;
  onOpenDetail: (productId: string) => void;
};

type CategorySwitchProps = {
  room: DraftRoom;
  category: SpecificationCategory;
};

function CategorySwitch({ room, category }: CategorySwitchProps) {
  const t = useTranslations('Specification');
  const pricing = useRoomPricing();
  const enableCategory = useDraft((state) => state.enableCategory);
  const disableCategory = useDraft((state) => state.disableCategory);
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
  const { clientId } = room;

  const toggle = useCallback(
    (included: boolean) => {
      if (included) {
        enableCategory(clientId, category.id);
      } else {
        disableCategory(clientId, category.id);
      }
    },
    [category.id, clientId, disableCategory, enableCategory],
  );

  let description: string | undefined;
  if (disabled) {
    description = t('excluded');
  } else if (product) {
    description = sum ? t('chosen', { name: product.name, sum }) : product.name;
  } else if (productId === null) {
    description = t('choose');
  }

  return (
    <SwitchRow
      title={t('include')}
      description={description}
      checked={!disabled}
      onCheckedChange={toggle}
    />
  );
}

export function Specification({
  room,
  categories,
  activeCategoryId,
  size,
  onCategoryChange,
  onOpenDetail,
}: SpecificationProps) {
  const t = useTranslations('Specification');
  const headingId = useId();
  const tabsId = useId();
  const queryClient = useQueryClient();
  const [unavailable, setUnavailable] = useState(false);

  const dismiss = useCallback(() => setUnavailable(false), []);
  const handleUnavailable = useCallback(() => {
    setUnavailable(true);
    void queryClient.invalidateQueries({ queryKey: [catalogRoots.roomTypes] });
    void queryClient.invalidateQueries({ queryKey: [catalogRoots.products] });
    onCategoryChange(null);
  }, [onCategoryChange, queryClient]);

  const index = categories.findIndex(
    (category) => category.id === activeCategoryId,
  );
  const active = categories[index];

  return (
    <section className={styles.root} aria-labelledby={headingId}>
      <SectionHeader
        id={headingId}
        size={size}
        title={t('title')}
        note={
          active
            ? t('note', { name: active.name, count: active.productCount })
            : undefined
        }
      />
      {unavailable ? (
        <Banner
          variant="warning"
          onDismiss={dismiss}
          dismissLabel={t('dismiss')}
        >
          {t('categoryGone')}
        </Banner>
      ) : null}
      {active ? (
        <>
          <Tabs
            id={tabsId}
            label={t('tabsLabel')}
            size={size}
            value={active.id}
            onValueChange={onCategoryChange}
          >
            {categories.map((category) => (
              <Tab key={category.id} value={category.id}>
                {category.name}
              </Tab>
            ))}
          </Tabs>
          <TabPanel
            key={active.id}
            tabsId={tabsId}
            value={active.id}
            selected
            className={styles.panel}
          >
            {active.productCount === 0 ? (
              <EmptyState
                headingLevel={3}
                title={t('emptyTitle')}
                text={t('emptyText')}
              />
            ) : (
              <>
                <CategorySwitch room={room} category={active} />
                <ProductShowcase
                  room={room}
                  category={{
                    id: active.id,
                    name: active.name,
                    position: index + 1,
                  }}
                  size={size}
                  onUnavailable={handleUnavailable}
                  onOpenDetail={onOpenDetail}
                />
              </>
            )}
          </TabPanel>
        </>
      ) : null}
    </section>
  );
}
