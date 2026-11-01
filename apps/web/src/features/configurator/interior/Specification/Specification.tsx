'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { type ChangeEvent, useCallback, useId, useState } from 'react';
import {
  Banner,
  EmptyState,
  SectionHeader,
  SegmentedControl,
  Select,
  Tab,
  TabPanel,
  Tabs,
} from '@/components/ui';
import { catalogRoots } from '@/lib/api/catalog';
import type { DraftRoom } from '@/lib/draft/schema';
import {
  enabledCategoryOf,
  groupCategories,
  surfaceSiblings,
} from '@/lib/draft/surfaces';
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
  surface: 'FLOOR' | 'WALLS' | 'CEILING' | 'NONE';
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
  const tSurface = useTranslations('Surface');
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
  const groups = groupCategories(
    categories.filter(
      (category) => category.productCount > 0 || category.id === active?.id,
    ),
  );
  const activeGroup = groups.find((group) =>
    group.categories.some((category) => category.id === active?.id),
  );
  const changeGroup = useCallback(
    (key: string) => {
      const group = groups.find((item) => item.key === key);
      if (group) {
        const target =
          enabledCategoryOf(group, room.selections) ?? group.categories[0];
        onCategoryChange(target.id);
      }
    },
    [groups, onCategoryChange, room.selections],
  );
  const groupLabel = (group: (typeof groups)[number]) =>
    group.surface === 'NONE'
      ? (group.categories[0]?.name ?? '')
      : tSurface(group.surface);
  const surfaceKey = activeGroup?.surface ?? 'NONE';
  const replaced =
    activeGroup && surfaceKey !== 'NONE'
      ? enabledCategoryOf(activeGroup, room.selections)
      : undefined;
  const replaces =
    replaced && surfaceKey !== 'NONE' && replaced.id !== active?.id
      ? { surface: tSurface(`for.${surfaceKey}`), name: replaced.name }
      : undefined;

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
      {active && activeGroup ? (
        <>
          <Tabs
            id={tabsId}
            label={t('tabsLabel')}
            size={size}
            value={activeGroup.key}
            onValueChange={changeGroup}
          >
            {groups.map((group) => (
              <Tab key={group.key} value={group.key}>
                {groupLabel(group)}
              </Tab>
            ))}
          </Tabs>
          <TabPanel
            key={activeGroup.key}
            tabsId={tabsId}
            value={activeGroup.key}
            selected
            className={styles.panel}
          >
            {activeGroup.categories.length > 1 ? (
              <SegmentedControl
                label={t('finishLabel')}
                value={active.id}
                options={activeGroup.categories.map((category) => ({
                  value: category.id,
                  label: category.name,
                }))}
                onValueChange={onCategoryChange}
              />
            ) : null}
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
                  siblingIds={surfaceSiblings(categories, active.id)}
                  replaces={replaces}
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
