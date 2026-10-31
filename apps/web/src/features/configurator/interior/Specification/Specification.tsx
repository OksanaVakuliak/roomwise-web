'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { type ChangeEvent, useCallback, useId, useState } from 'react';
import {
  Banner,
  EmptyState,
  SectionHeader,
  Select,
  Tab,
  TabPanel,
  Tabs,
} from '@/components/ui';
import { catalogRoots } from '@/lib/api/catalog';
import type { DraftRoom } from '@/lib/draft/schema';
import {
  ProductShowcase,
  type SortOrder,
} from '../ProductShowcase/ProductShowcase';
import styles from './Specification.module.css';

const SORT_ORDERS: readonly SortOrder[] = ['server', 'asc', 'desc'];

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
  hideTitle?: boolean;
  onCategoryChange: (categoryId: string | null) => void;
  onChosen?: () => void;
  onOpenDetail: (productId: string) => void;
};

export function Specification({
  room,
  categories,
  activeCategoryId,
  size,
  hideTitle = false,
  onCategoryChange,
  onChosen,
  onOpenDetail,
}: SpecificationProps) {
  const t = useTranslations('Specification');
  const tShowcase = useTranslations('ProductShowcase');
  const headingId = useId();
  const tabsId = useId();
  const queryClient = useQueryClient();
  const [unavailable, setUnavailable] = useState(false);
  const [order, setOrder] = useState<SortOrder>('server');
  const changeOrder = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) =>
      setOrder(event.target.value as SortOrder),
    [],
  );

  const dismiss = useCallback(() => setUnavailable(false), []);
  const handleUnavailable = useCallback(() => {
    setUnavailable(true);
    void queryClient.invalidateQueries({ queryKey: [catalogRoots.roomTypes] });
    void queryClient.invalidateQueries({ queryKey: [catalogRoots.products] });
    onCategoryChange(null);
  }, [onCategoryChange, queryClient]);

  const sort = (
    <Select
      label={tShowcase('sortLabel')}
      hideLabel
      value={order}
      onChange={changeOrder}
      className={styles.sort}
    >
      {SORT_ORDERS.map((value) => (
        <option key={value} value={value}>
          {tShowcase(`sort.${value}`)}
        </option>
      ))}
    </Select>
  );
  const active = categories.find(
    (category) => category.id === activeCategoryId,
  );

  const sortable = active !== undefined && active.productCount > 0;

  return (
    <section
      className={styles.root}
      aria-labelledby={hideTitle ? undefined : headingId}
      aria-label={hideTitle ? t('title') : undefined}
    >
      {hideTitle ? null : (
        <SectionHeader
          id={headingId}
          size="mobile"
          title={t('title')}
          note={sortable ? sort : undefined}
        />
      )}
      {hideTitle && sortable ? sort : null}
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
                <ProductShowcase
                  room={room}
                  category={{ id: active.id, name: active.name }}
                  size={size}
                  order={order}
                  onUnavailable={handleUnavailable}
                  onChosen={onChosen}
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
