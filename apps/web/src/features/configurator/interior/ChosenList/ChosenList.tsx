'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useId } from 'react';
import { Button, ImageWithFallback, SectionHeader } from '@/components/ui';
import { useCategoryProducts } from '@/lib/api/catalog';
import { cx } from '@/lib/cx';
import type { DraftRoom } from '@/lib/draft/schema';
import {
  enabledCategoryOf,
  groupCategories,
  surfaceSiblings,
} from '@/lib/draft/surfaces';
import { optionRoomLine } from '@/lib/engine/card-cost';
import { hasHeatedFloorWarning } from '@/lib/engine/heated-floor';
import { useDraft } from '@/stores/draft';
import { useChosenRoomOptions } from '../use-room-options';
import type { RoomPricing } from '../use-room-pricing';
import styles from './ChosenList.module.css';

export type ChosenListCategory = {
  id: string;
  name: string;
  productCount: number;
  surface: 'FLOOR' | 'WALLS' | 'CEILING' | 'NONE';
};

export type ChosenListGroup = {
  room: DraftRoom;
  name: string;
  categories: readonly ChosenListCategory[];
};

export type ChosenListProps = {
  groups: readonly ChosenListGroup[];
  pricing: RoomPricing | null;
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
  siblingIds: readonly string[];
  active: boolean;
  pricing: RoomPricing | null;
  onSelect: (roomClientId: string, categoryId: string) => void;
};

function ChosenRow({
  room,
  roomName,
  category,
  siblingIds,
  active,
  pricing,
  onSelect,
}: ChosenRowProps) {
  const t = useTranslations('ChosenList');
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
  const warned = hasHeatedFloorWarning(line);
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
      enableCategory(clientId, category.id, siblingIds);
    }
  }, [category.id, clientId, enableCategory, onSelect, productId, siblingIds]);
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
            <span className={cx(styles.category, styles.muted)}>
              {category.name}
            </span>
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
          {warned ? (
            <span className={styles.warning}>{t('heatedFloorWarning')}</span>
          ) : null}
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

type ChosenOptionRowProps = {
  room: DraftRoom;
  roomName: string;
  pricing: RoomPricing | null;
  optionId: string;
  name: string;
};

function ChosenOptionRow({
  room,
  roomName,
  pricing,
  optionId,
  name,
}: ChosenOptionRowProps) {
  const t = useTranslations('ChosenList');
  const toggle = useDraft((state) => state.toggleRoomOption);
  const { clientId } = room;
  const remove = useCallback(
    () => toggle(optionId, clientId),
    [clientId, optionId, toggle],
  );
  const line = pricing
    ? optionRoomLine(pricing.context, clientId, optionId)
    : null;
  const sum =
    pricing && line?.status === 'OK' ? pricing.formatLine(line) : null;

  return (
    <li className={cx(styles.item, styles.option)}>
      <span className={styles.row}>
        <span className={styles.body}>
          <span className={styles.category}>{t('option')}</span>
          <span className={styles.name}>{name}</span>
        </span>
        {sum ? <span className={`${styles.sum} num`}>{sum}</span> : null}
      </span>
      <Button
        kind="outline"
        className={styles.action}
        aria-label={t('removeLabel', { category: name, room: roomName })}
        onClick={remove}
      >
        {t('remove')}
      </Button>
    </li>
  );
}

type ChosenOptionsProps = {
  room: DraftRoom;
  roomName: string;
  pricing: RoomPricing | null;
  chosen: ReturnType<typeof useChosenRoomOptions>;
};

function ChosenOptions({
  room,
  roomName,
  pricing,
  chosen,
}: ChosenOptionsProps) {
  return chosen.map((option) => (
    <ChosenOptionRow
      key={option.id}
      room={room}
      roomName={roomName}
      pricing={pricing}
      optionId={option.id}
      name={option.name}
    />
  ));
}

type ChosenSectionProps = {
  group: ChosenListGroup;
  pricing: RoomPricing | null;
  current: boolean;
  activeCategoryId: string | null;
  onSelect: (roomClientId: string, categoryId: string) => void;
};

function ChosenSection({
  group,
  pricing,
  current,
  activeCategoryId,
  onSelect,
}: ChosenSectionProps) {
  const t = useTranslations('ChosenList');
  const headingId = useId();
  const { room, name, categories } = group;
  const listed = categories.filter((category) => category.productCount > 0);
  const rows = groupCategories(listed).map((group) => {
    const category =
      enabledCategoryOf(group, room.selections) ??
      group.categories.find(
        (item) => room.selections[item.id]?.productId != null,
      ) ??
      group.categories[0];
    return {
      key: group.key,
      category,
      siblingIds: surfaceSiblings(categories, category.id),
      active: group.categories.some((item) => item.id === activeCategoryId),
    };
  });
  const chosenOptions = useChosenRoomOptions(room);
  const lines = pricing
    ? [
        ...rows.map(({ category }) =>
          pricing.materialsLine(room.clientId, category.id),
        ),
        ...chosenOptions.map((option) =>
          optionRoomLine(pricing.context, room.clientId, option.id),
        ),
      ].flatMap((line) => (line?.status === 'OK' ? [line] : []))
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
        {rows.map((row) => (
          <ChosenRow
            key={row.key}
            room={room}
            roomName={name}
            category={row.category}
            siblingIds={row.siblingIds}
            active={current && row.active}
            pricing={pricing}
            onSelect={onSelect}
          />
        ))}
        <ChosenOptions
          room={room}
          roomName={name}
          pricing={pricing}
          chosen={chosenOptions}
        />
      </ul>
    </section>
  );
}

export function ChosenList({
  groups,
  pricing,
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
          pricing={pricing}
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
