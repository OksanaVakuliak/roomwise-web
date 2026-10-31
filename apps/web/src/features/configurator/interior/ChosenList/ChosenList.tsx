'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useId } from 'react';
import { Button, ImageWithFallback, SectionHeader } from '@/components/ui';
import { useCategoryProducts } from '@/lib/api/catalog';
import { cx } from '@/lib/cx';
import type { DraftRoom } from '@/lib/draft/schema';
import { useDraft } from '@/stores/draft';
import { useRoomPricing } from '../use-room-pricing';
import styles from './ChosenList.module.css';

export type ChosenListCategory = {
  id: string;
  name: string;
  productCount: number;
};

export type ChosenListGroup = {
  room: DraftRoom;
  name: string;
  categories: readonly ChosenListCategory[];
};

export type ChosenListProps = {
  groups: readonly ChosenListGroup[];
  currentRoomId: string;
  activeCategoryId: string | null;
  size: 'mobile' | 'desktop';
  onSelect: (roomClientId: string, categoryId: string) => void;
  onOpenPicker?: () => void;
};

type ChosenRowProps = {
  room: DraftRoom;
  roomName: string;
  category: ChosenListCategory;
  active: boolean;
  onSelect: (roomClientId: string, categoryId: string) => void;
};

function ChosenRow({
  room,
  roomName,
  category,
  active,
  onSelect,
}: ChosenRowProps) {
  const t = useTranslations('ChosenList');
  const pricing = useRoomPricing();
  const enableCategory = useDraft((state) => state.enableCategory);
  const disableCategory = useDraft((state) => state.disableCategory);
  const { clientId } = room;
  const selection = room.selections[category.id];
  const productId = selection?.productId ?? null;
  const disabled = selection?.disabled ?? false;
  const productsQuery = useCategoryProducts(
    productId === null ? null : category.id,
  );
  const product = productsQuery.data?.items.find(
    (item) => item.id === productId,
  );
  const line = pricing?.materialsLine(clientId, category.id);
  const sum =
    pricing && line?.status === 'OK' ? pricing.formatLine(line) : null;
  const select = useCallback(
    () => onSelect(clientId, category.id),
    [category.id, clientId, onSelect],
  );
  const remove = useCallback(
    () => disableCategory(clientId, category.id),
    [category.id, clientId, disableCategory],
  );
  const add = useCallback(() => {
    if (productId === null) {
      onSelect(clientId, category.id);
    } else {
      enableCategory(clientId, category.id);
    }
  }, [category.id, clientId, enableCategory, onSelect, productId]);
  const shown = !disabled && product !== undefined;
  const context = { category: category.name, room: roomName };

  if (disabled) {
    return (
      <li className={cx(styles.item, styles.excluded)}>
        <button
          type="button"
          className={cx(styles.row, active && styles.active)}
          aria-current={active ? 'true' : undefined}
          onClick={select}
        >
          <span className={styles.body}>
            <span className={styles.category}>{category.name}</span>
            <span className={styles.muted}>{t('excluded')}</span>
          </span>
        </button>
        <Button
          kind="outline"
          className={styles.action}
          aria-label={t('addLabel', context)}
          onClick={add}
        >
          {t('add')}
        </Button>
      </li>
    );
  }

  return (
    <li className={styles.item}>
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
          <span className={cx(styles.name, productId === null && styles.muted)}>
            {productId === null ? t('choose') : product?.name}
          </span>
        </span>
        {shown && sum ? (
          <span className={`${styles.sum} num`}>{sum}</span>
        ) : null}
      </button>
      {productId === null ? null : (
        <Button
          kind="outline"
          className={styles.action}
          aria-label={t('removeLabel', context)}
          onClick={remove}
        >
          {t('remove')}
        </Button>
      )}
    </li>
  );
}

type ChosenSectionProps = {
  group: ChosenListGroup;
  current: boolean;
  activeCategoryId: string | null;
  onSelect: (roomClientId: string, categoryId: string) => void;
};

function ChosenSection({
  group,
  current,
  activeCategoryId,
  onSelect,
}: ChosenSectionProps) {
  const t = useTranslations('ChosenList');
  const headingId = useId();
  const pricing = useRoomPricing();
  const { room, name } = group;
  const listed = group.categories.filter(
    (category) => category.productCount > 0,
  );
  const lines = pricing
    ? listed.flatMap((category) => {
        const line = pricing.materialsLine(room.clientId, category.id);
        return line?.status === 'OK' ? [line] : [];
      })
    : [];

  return (
    <section className={styles.section} aria-labelledby={headingId}>
      <h3 id={headingId} className={styles.room}>
        <span className={styles.roomName}>{name}</span>
        {current ? (
          <span className={styles.current}>{t('current')}</span>
        ) : null}
        {pricing && lines.length > 0 ? (
          <span className={`${styles.roomSum} num`}>
            {pricing.formatTotal(lines)}
          </span>
        ) : null}
      </h3>
      <ul className={styles.list} aria-labelledby={headingId}>
        {listed.map((category) => (
          <ChosenRow
            key={category.id}
            room={room}
            roomName={name}
            category={category}
            active={current && category.id === activeCategoryId}
            onSelect={onSelect}
          />
        ))}
      </ul>
    </section>
  );
}

export function ChosenList({
  groups,
  currentRoomId,
  activeCategoryId,
  size,
  onSelect,
  onOpenPicker,
}: ChosenListProps) {
  const t = useTranslations('ChosenList');

  return (
    <section className={styles.root}>
      <SectionHeader size={size} title={t('title')} />
      {groups.map((group) => (
        <ChosenSection
          key={group.room.clientId}
          group={group}
          current={group.room.clientId === currentRoomId}
          activeCategoryId={activeCategoryId}
          onSelect={onSelect}
        />
      ))}
      {onOpenPicker ? (
        <Button kind="outline" onClick={onOpenPicker}>
          {t('openPicker')}
        </Button>
      ) : null}
    </section>
  );
}
