'use client';

import type { Announcements, UniqueIdentifier } from '@dnd-kit/core';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import {
  type ChangeEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Banner,
  Button,
  ButtonLink,
  EmptyState,
  IconButton,
  LocalizedField,
  type LocalizedValue,
  PageTitle,
  SectionHeader,
  Select,
  Skeleton,
  SortableList,
  StatusBadge,
} from '@/components/ui';
import {
  ConflictBanner,
  SaveBar,
  useAdminForm,
  useLeaveGuard,
  useSaveToast,
} from '@/features/admin/forms';
import { useAdminSession } from '@/features/admin/session';
import {
  type AdminRoomType,
  fetchRoomTypes,
  useCategories,
  useRenameRoomType,
  useReplaceRoomTypeCategories,
  useRoomTypes,
} from '@/lib/admin-api/catalog';
import { adminErrorMessage, toAdminError } from '@/lib/admin-api/errors';
import styles from './RoomTypeForm.module.css';

const LIST_HREF = '/admin/catalog/room-types';
const SECTION_ID = 'room-type-categories';

type Values = { name: LocalizedValue; categoryIds: string[] };

type Entry = AdminRoomType['categories'][number];

const toValues = (item: AdminRoomType): Values => ({
  name: { en: item.name.en, uk: item.name.uk },
  categoryIds: item.categories.map((category) => category.id),
});

const sameName = (a: LocalizedValue, b: LocalizedValue) =>
  a.en === b.en && a.uk === b.uk;

const sameIds = (a: string[], b: string[]) =>
  a.length === b.length && a.every((id, index) => id === b[index]);

type CategoryRowProps = {
  entry: Entry;
  locale: 'en' | 'uk';
  statusLabel: string;
  removeLabel: string;
  onRemove: (id: string) => void;
};

function CategoryRow({
  entry,
  locale,
  statusLabel,
  removeLabel,
  onRemove,
}: CategoryRowProps) {
  const remove = useCallback(() => onRemove(entry.id), [entry.id, onRemove]);

  return (
    <div className={styles.row}>
      <span className={styles.rowName}>{entry.name[locale]}</span>
      {entry.status === 'PUBLISHED' ? null : (
        <StatusBadge status={entry.status} label={statusLabel} />
      )}
      <IconButton icon="trash" label={removeLabel} onClick={remove} />
    </div>
  );
}

type RoomTypeEditorProps = { item: AdminRoomType };

function RoomTypeEditor({ item }: RoomTypeEditorProps) {
  const t = useTranslations('AdminCatalog.roomTypes.form');
  const tStatus = useTranslations('Admin.status');
  const tFields = useTranslations('Admin.fields');
  const tRoot = useTranslations();
  const locale = useLocale() as 'en' | 'uk';
  const format = useFormatter();
  const { withReauth } = useAdminSession();
  const rename = useRenameRoomType();
  const replace = useReplaceRoomTypeCategories();
  const categories = useCategories();
  const notify = useSaveToast();
  const [pending, setPending] = useState('');
  const applied = useRef<{ revision: string; values: Values } | null>(null);
  const itemId = item.id;

  const fetchLatest = useCallback(async () => {
    applied.current = null;
    const latest = (await fetchRoomTypes()).find(
      (candidate) => candidate.id === itemId,
    );
    if (!latest) throw new Error('missing');
    return {
      values: toValues(latest),
      revision: latest.revision,
      changedBy: latest.updatedBy?.login ?? null,
      changedAt: latest.updatedAt,
    };
  }, [itemId]);

  const initial = useMemo(() => toValues(item), [item]);
  const form = useAdminForm<Values>({
    initial,
    revision: item.revision,
    fetchLatest,
  });
  const { dialog } = useLeaveGuard(form.dirty, { fallbackHref: LIST_HREF });
  const { values, initial: baseline, setField, submit } = form;
  const { mutateAsync: renameAsync } = rename;
  const { mutateAsync: replaceAsync } = replace;

  const persist = useCallback(
    async (current: Values, revision: string | null) => {
      const start = applied.current ?? {
        revision: revision ?? item.revision,
        values: baseline,
      };
      let latestRevision = start.revision;
      let saved: AdminRoomType | null = null;
      if (!sameName(current.name, start.values.name)) {
        saved = await withReauth(() =>
          renameAsync({
            id: itemId,
            body: { name: current.name, revision: latestRevision },
          }),
        );
        latestRevision = saved.revision;
        applied.current = {
          revision: latestRevision,
          values: { ...start.values, name: current.name },
        };
      }
      if (!sameIds(current.categoryIds, start.values.categoryIds)) {
        saved = await withReauth(() =>
          replaceAsync({
            id: itemId,
            body: {
              categoryIds: current.categoryIds,
              revision: latestRevision,
            },
          }),
        );
      }
      applied.current = null;
      if (!saved) return { revision: latestRevision, values: current };
      return { revision: saved.revision, values: toValues(saved) };
    },
    [item.revision, itemId, baseline, withReauth, renameAsync, replaceAsync],
  );

  const onSave = useCallback(() => {
    const affectsCost = !sameIds(values.categoryIds, baseline.categoryIds);
    void submit(persist).then((ok) => {
      if (ok) notify({ affectsCost });
    });
  }, [values, baseline, submit, persist, notify]);

  const onNameChange = useCallback(
    (name: LocalizedValue) => setField('name', name),
    [setField],
  );

  const entries = useMemo(() => {
    const known = new Map<string, Entry>();
    for (const category of categories.data ?? []) {
      known.set(category.id, category);
    }
    for (const category of item.categories) known.set(category.id, category);
    return known;
  }, [categories.data, item.categories]);

  const rows = useMemo<Entry[]>(
    () =>
      values.categoryIds.map(
        (id) =>
          entries.get(id) ?? {
            id,
            name: { en: id, uk: id },
            status: 'DRAFT',
            surface: 'NONE',
          },
      ),
    [values.categoryIds, entries],
  );

  const nameOf = useCallback(
    (id: UniqueIdentifier) => entries.get(String(id))?.name[locale] ?? '',
    [entries, locale],
  );
  const positionOf = useCallback(
    (id: UniqueIdentifier) => values.categoryIds.indexOf(String(id)) + 1,
    [values.categoryIds],
  );

  const total = values.categoryIds.length;
  const announcements = useMemo<Announcements>(
    () => ({
      onDragStart: ({ active }) =>
        t('pickedUp', {
          name: nameOf(active.id),
          position: positionOf(active.id),
          total,
        }),
      onDragOver: ({ active, over }) =>
        over
          ? t('movedOver', {
              name: nameOf(active.id),
              position: positionOf(over.id),
              total,
            })
          : undefined,
      onDragEnd: ({ active, over }) =>
        t('dropped', {
          name: nameOf(active.id),
          position: positionOf(over ? over.id : active.id),
          total,
        }),
      onDragCancel: ({ active }) => t('cancelled', { name: nameOf(active.id) }),
    }),
    [t, nameOf, positionOf, total],
  );

  const getKey = useCallback((entry: Entry) => entry.id, []);
  const dragLabel = useCallback(
    (entry: Entry) => t('drag', { name: entry.name[locale] }),
    [t, locale],
  );
  const moveUpLabel = useCallback(
    (entry: Entry) => t('moveUp', { name: entry.name[locale] }),
    [t, locale],
  );
  const moveDownLabel = useCallback(
    (entry: Entry) => t('moveDown', { name: entry.name[locale] }),
    [t, locale],
  );
  const onReorder = useCallback(
    (next: Entry[]) =>
      setField(
        'categoryIds',
        next.map((entry) => entry.id),
      ),
    [setField],
  );
  const onRemove = useCallback(
    (id: string) =>
      setField(
        'categoryIds',
        values.categoryIds.filter((current) => current !== id),
      ),
    [setField, values.categoryIds],
  );

  const renderItem = useCallback(
    (entry: Entry) => (
      <CategoryRow
        entry={entry}
        locale={locale}
        statusLabel={tStatus(entry.status)}
        removeLabel={t('remove', { name: entry.name[locale] })}
        onRemove={onRemove}
      />
    ),
    [locale, tStatus, t, onRemove],
  );

  const available = useMemo(
    () =>
      (categories.data ?? []).filter(
        (category) =>
          category.status !== 'ARCHIVED' &&
          !values.categoryIds.includes(category.id),
      ),
    [categories.data, values.categoryIds],
  );

  const onPendingChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => setPending(event.target.value),
    [],
  );
  const onAdd = useCallback(() => {
    if (!pending) return;
    setField('categoryIds', [...values.categoryIds, pending]);
    setPending('');
  }, [pending, setField, values.categoryIds]);

  const failure = form.error;
  const message =
    failure !== null &&
    failure.kind !== 'validation' &&
    failure.kind !== 'stale'
      ? adminErrorMessage(failure)
      : null;

  const time = format.dateTime(new Date(item.updatedAt), {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className={styles.root}>
      <PageTitle>{t('editTitle', { name: item.name[locale] })}</PageTitle>
      <p className={styles.meta}>
        {item.updatedBy
          ? t('lastChanged', { time, user: item.updatedBy.login })
          : t('lastChangedAnon', { time })}
      </p>
      {form.conflict ? (
        <ConflictBanner
          changedBy={form.conflict.changedBy}
          changedAt={form.conflict.changedAt}
          revealed={form.conflictRevealed}
          differingCount={form.differing.length}
          onReveal={form.revealConflict}
          onAccept={form.acceptLatest}
          onDismiss={form.dismissConflict}
        />
      ) : null}
      {message ? (
        <Banner variant="error">
          {tRoot(
            `${message.namespace}.${message.key}` as never,
            message.values as never,
          )}
        </Banner>
      ) : null}
      <LocalizedField
        key={form.resetKey}
        label={t('name')}
        value={values.name}
        onChange={onNameChange}
        languageLabels={{
          en: tFields('languages.en'),
          uk: tFields('languages.uk'),
        }}
        requiredForPublishLabel={tFields('requiredForPublish')}
        errors={{ en: form.errors['name.en'], uk: form.errors['name.uk'] }}
      />
      <section className={styles.section} aria-labelledby={SECTION_ID}>
        <SectionHeader
          id={SECTION_ID}
          title={t('categoriesTitle')}
          note={t('categoriesNote')}
        />
        {rows.length > 0 ? (
          <SortableList
            items={rows}
            getKey={getKey}
            renderItem={renderItem}
            onReorder={onReorder}
            label={t('categoriesTitle')}
            dragLabel={dragLabel}
            moveUpLabel={moveUpLabel}
            moveDownLabel={moveDownLabel}
            announcements={announcements}
            screenReaderInstructions={t('instructions')}
          />
        ) : (
          <p>{t('categoriesEmpty')}</p>
        )}
        {form.errors.categoryIds ? (
          <p className={styles.error} role="alert">
            {form.errors.categoryIds}
          </p>
        ) : null}
        <div className={styles.add}>
          <div className={styles.addSelect}>
            <Select
              label={t('addLabel')}
              placeholder={t('addPlaceholder')}
              hint={available.length === 0 ? t('addNone') : undefined}
              value={pending}
              disabled={available.length === 0}
              onChange={onPendingChange}
            >
              {available.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.status === 'DRAFT'
                    ? t('draftMark', { name: category.name[locale] })
                    : category.name[locale]}
                </option>
              ))}
            </Select>
          </div>
          <Button kind="outline" disabled={!pending} onClick={onAdd}>
            {t('add')}
          </Button>
        </div>
      </section>
      <SaveBar dirty={form.dirty} saving={form.saving} onSave={onSave} />
      {dialog}
    </div>
  );
}

export type RoomTypeFormProps = { code: string };

export function RoomTypeForm({ code }: RoomTypeFormProps) {
  const t = useTranslations('AdminCatalog.roomTypes');
  const tRoot = useTranslations();
  const query = useRoomTypes();
  const { refetch } = query;
  const retry = useCallback(() => void refetch(), [refetch]);

  if (query.error) {
    const message = adminErrorMessage(toAdminError(query.error));
    return (
      <div className={styles.root}>
        <Banner
          variant="error"
          title={t('form.loadFailed')}
          action={<Button onClick={retry}>{t('form.retry')}</Button>}
        >
          {tRoot(
            `${message.namespace}.${message.key}` as never,
            message.values as never,
          )}
        </Banner>
      </div>
    );
  }

  if (query.isPending) {
    return (
      <div className={styles.root}>
        <div role="status" aria-label={t('form.loading')}>
          <Skeleton variant="block" height="3rem" />
        </div>
      </div>
    );
  }

  const item = query.data.find((candidate) => candidate.code === code);

  if (!item) {
    return (
      <div className={styles.root}>
        <PageTitle>{t('title')}</PageTitle>
        <EmptyState
          title={t('form.notFoundTitle')}
          text={t('form.notFoundText')}
          action={
            <ButtonLink kind="outline" href={LIST_HREF}>
              {t('form.back')}
            </ButtonLink>
          }
        />
      </div>
    );
  }

  return <RoomTypeEditor key={item.id} item={item} />;
}
