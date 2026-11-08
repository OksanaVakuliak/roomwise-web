'use client';

import {
  type EstimateLine,
  isShareSurface,
  type ShareSurface,
} from '@roomwise/calc-engine';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useId } from 'react';
import {
  Button,
  ImageWithFallback,
  SectionHeader,
  SpecComponents,
  Stepper,
} from '@/components/ui';
import { useCategoryProducts } from '@/lib/api/catalog';
import { cx } from '@/lib/cx';
import { roomMetrics } from '@/lib/draft/rooms';
import type { DraftRoom } from '@/lib/draft/schema';
import { isSharedCovering } from '@/lib/draft/shares';
import {
  enabledCategoryOf,
  groupCategories,
  surfaceSiblings,
} from '@/lib/draft/surfaces';
import { optionRoomLine } from '@/lib/engine/card-cost';
import { hasHeatedFloorWarning } from '@/lib/engine/heated-floor';
import { area } from '@/lib/format';
import { useDraft } from '@/stores/draft';
import { useChosenRoomOptions } from '../../shell/use-room-options';
import type { RoomPricing } from '../../shell/use-room-pricing';
import { type LineDetails, useSpecComponents } from '../use-spec-components';
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
  categories: readonly ChosenListCategory[];
  siblingIds: readonly string[];
  active: boolean;
  shared: boolean;
  surfaceArea: number | null;
  pricing: RoomPricing | null;
  describe: (line: EstimateLine | null | undefined) => LineDetails;
  onSelect: (roomClientId: string, categoryId: string) => void;
};

type ShareFieldProps = {
  room: DraftRoom;
  roomName: string;
  category: ChosenListCategory;
  surfaceArea: number | null;
};

function ShareField({
  room,
  roomName,
  category,
  surfaceArea,
}: ShareFieldProps) {
  const t = useTranslations('ChosenList');
  const locale = useLocale();
  const setAreaShare = useDraft((state) => state.setAreaShare);
  const { clientId } = room;
  const percent = room.selections[category.id]?.areaShare ?? 100;
  const change = useCallback(
    (value: number) => setAreaShare(clientId, category.id, value),
    [category.id, clientId, setAreaShare],
  );
  const context = { category: category.name, room: roomName };

  return (
    <Stepper
      className={styles.share}
      label={t('share')}
      aria-label={t('shareLabel', context)}
      unit="%"
      decrementLabel={t('shareDecrement', context)}
      incrementLabel={t('shareIncrement', context)}
      hint={
        surfaceArea === null
          ? undefined
          : t('shareArea', {
              area: area((surfaceArea * percent) / 100, locale),
            })
      }
      value={percent}
      min={1}
      max={100}
      onValueChange={change}
    />
  );
}

function ChosenRow({
  room,
  roomName,
  category,
  categories,
  siblingIds,
  active,
  shared,
  surfaceArea,
  pricing,
  describe,
  onSelect,
}: ChosenRowProps) {
  const t = useTranslations('ChosenList');
  const tSpec = useTranslations('Specification');
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
  const details = describe(line);
  const sum =
    pricing && line?.status === 'OK' ? pricing.formatLine(line) : null;
  const select = useCallback(
    () => onSelect(clientId, category.id),
    [category.id, clientId, onSelect],
  );
  const remove = useCallback(
    () => disableCategory(clientId, category.id, categories),
    [categories, category.id, clientId, disableCategory],
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
          {details.laborMissing ? (
            <span className={styles.warning}>{tSpec('laborMissing')}</span>
          ) : null}
        </span>
        {shown && sum ? (
          <span className={`${styles.sum} num`}>{sum}</span>
        ) : null}
      </button>
      {productId === null && !shared ? null : (
        <Button
          kind="outline"
          className={styles.action}
          aria-label={t('removeLabel', context)}
          onClick={remove}
        >
          {t('remove')}
        </Button>
      )}
      {shared ? (
        <ShareField
          room={room}
          roomName={roomName}
          category={category}
          surfaceArea={surfaceArea}
        />
      ) : null}
      {productId !== null && details.items.length > 0 ? (
        <div className={styles.details}>
          <SpecComponents items={details.items} />
        </div>
      ) : null}
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

type AddCoveringButtonProps = {
  room: DraftRoom;
  roomName: string;
  candidate: ChosenListCategory;
  categories: readonly ChosenListCategory[];
  onSelect: (roomClientId: string, categoryId: string) => void;
};

function AddCoveringButton({
  room,
  roomName,
  candidate,
  categories,
  onSelect,
}: AddCoveringButtonProps) {
  const t = useTranslations('ChosenList');
  const addCovering = useDraft((state) => state.addCovering);
  const { clientId } = room;
  const add = useCallback(() => {
    addCovering(clientId, candidate.id, categories);
    onSelect(clientId, candidate.id);
  }, [addCovering, candidate.id, categories, clientId, onSelect]);

  return (
    <li className={styles.addCovering}>
      <Button
        kind="outline"
        className={styles.action}
        aria-label={t('addCoveringLabel', {
          category: candidate.name,
          room: roomName,
        })}
        onClick={add}
      >
        {t('addCovering', { category: candidate.name })}
      </Button>
    </li>
  );
}

type ShareNoteProps = {
  surface: ShareSurface;
  total: number;
  surfaceArea: number | null;
};

function ShareNote({ surface, total, surfaceArea }: ShareNoteProps) {
  const t = useTranslations('ChosenList');
  const tWarning = useTranslations('Estimate.warning');
  const left = 100 - total;

  return (
    <li
      className={cx(styles.note, left < 0 ? styles.warning : styles.hint)}
      role="status"
      aria-live="polite"
    >
      {left < 0
        ? t('shareOver', { sum: total })
        : tWarning('AREA_SHARE_UNALLOCATED', {
            surface,
            percent: left,
            sqm:
              surfaceArea === null
                ? 0
                : Math.round(((surfaceArea * left) / 100) * 10) / 10,
          })}
    </li>
  );
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
  const tSpec = useTranslations('Specification');
  const headingId = useId();
  const { room, name, categories } = group;
  const describe = useSpecComponents(pricing, categories);
  const listed = categories.filter((category) => category.productCount > 0);
  const metrics = roomMetrics(room);
  const surfaces = groupCategories(listed).map((surfaceGroup) => {
    const { surface } = surfaceGroup;
    const shareable = isShareSurface(surface);
    const sharedOnes = shareable
      ? surfaceGroup.categories.filter((item) =>
          isSharedCovering(room.selections[item.id]),
        )
      : [];
    const multiple = sharedOnes.length >= 2;
    const single =
      enabledCategoryOf(surfaceGroup, room.selections) ??
      surfaceGroup.categories.find(
        (item) => room.selections[item.id]?.productId != null,
      ) ??
      surfaceGroup.categories[0];
    const shown = multiple ? sharedOnes : [single];
    const hasCovering = surfaceGroup.categories.some(
      (item) => room.selections[item.id]?.disabled === false,
    );
    const surfaceArea =
      surface === 'WALLS'
        ? (metrics?.wallArea ?? null)
        : surface === 'FLOOR'
          ? (metrics?.floorArea ?? null)
          : null;
    return {
      key: surfaceGroup.key,
      surface: shareable ? surface : null,
      shown: shown.map((category) => ({
        category,
        siblingIds: surfaceSiblings(categories, category.id),
        active: multiple
          ? category.id === activeCategoryId
          : surfaceGroup.categories.some(
              (item) => item.id === activeCategoryId,
            ),
      })),
      multiple,
      surfaceArea,
      total: sharedOnes.reduce(
        (sum, item) =>
          room.selections[item.id]?.productId != null
            ? sum + (room.selections[item.id]?.areaShare ?? 0)
            : sum,
        0,
      ),
      candidates:
        shareable && hasCovering
          ? surfaceGroup.categories.filter(
              (item) => room.selections[item.id]?.disabled !== false,
            )
          : [],
    };
  });
  const rows = surfaces.flatMap((item) => item.shown);
  const chosenOptions = useChosenRoomOptions(room);
  const nothingOn =
    pricing?.partial === true &&
    listed.length > 0 &&
    listed.every((category) => room.selections[category.id]?.disabled);
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
      {nothingOn ? <p className={styles.hint}>{tSpec('enableHint')}</p> : null}
      <ul className={styles.list} aria-labelledby={headingId}>
        {surfaces.flatMap((item) => [
          ...item.shown.map((row) => (
            <ChosenRow
              key={row.category.id}
              room={room}
              roomName={name}
              category={row.category}
              categories={categories}
              siblingIds={row.siblingIds}
              active={current && row.active}
              shared={item.multiple}
              surfaceArea={item.surfaceArea}
              pricing={pricing}
              describe={describe}
              onSelect={onSelect}
            />
          )),
          ...item.candidates.map((candidate) => (
            <AddCoveringButton
              key={`add:${candidate.id}`}
              room={room}
              roomName={name}
              candidate={candidate}
              categories={categories}
              onSelect={onSelect}
            />
          )),
          ...(item.multiple && item.surface !== null && item.total !== 100
            ? [
                <ShareNote
                  key={`note:${item.key}`}
                  surface={item.surface}
                  total={item.total}
                  surfaceArea={item.surfaceArea}
                />,
              ]
            : []),
        ])}
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
