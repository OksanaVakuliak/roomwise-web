'use client';

import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { type ChangeEvent, useCallback, useRef, useState } from 'react';
import {
  Banner,
  Checkbox,
  ConfirmDialog,
  LocalizedField,
  NumberField,
  PageTitle,
  Select,
  StatusBadge,
} from '@/components/ui';
import {
  ConflictBanner,
  SaveBar,
  useAdminForm,
  useLeaveGuard,
  useSaveToast,
} from '@/features/admin/forms';
import { isEqual } from '@/features/admin/forms/is-equal';
import { useAdminSession } from '@/features/admin/session';
import { useRouter } from '@/i18n/navigation';
import {
  type AdminCategory,
  fetchCategories,
  useChangeCategoryStatus,
  useCreateCategory,
  useDeleteCategory,
  useRoomTypes,
  useUpdateCategory,
} from '@/lib/admin-api/catalog';
import {
  type AdminError,
  adminErrorMessage,
  toAdminError,
} from '@/lib/admin-api/errors';
import styles from './CategoryForm.module.css';
import {
  type CategoryValues,
  emptyValues,
  parseWaste,
  requireTranslations,
  SURFACES,
  toValues,
} from './category-values';

const LIST_HREF = '/admin/catalog/categories';

type InUse = { productCount: number; roomTypes: string[]; styles: string[] };

type Status = AdminCategory['status'];

type Applied = {
  revision: string;
  submitted: CategoryValues;
  values: CategoryValues;
};

const costChanged = (values: CategoryValues, initial: CategoryValues) =>
  values.wastePercent !== initial.wastePercent ||
  values.requiresPutty !== initial.requiresPutty ||
  values.surface !== initial.surface;

const strings = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];

function readInUse(error: AdminError, locale: 'en' | 'uk'): InUse {
  const params = error.kind === 'inUse' ? error.params : {};
  const styleNames = Array.isArray(params.styles)
    ? params.styles.flatMap((style: { name?: Record<string, string> }) =>
        style?.name?.[locale] ? [style.name[locale]] : [],
      )
    : [];
  return {
    productCount:
      typeof params.productCount === 'number' ? params.productCount : 0,
    roomTypes: strings(params.roomTypeCodes),
    styles: styleNames,
  };
}

export type CategoryEditorProps = { category?: AdminCategory };

export function CategoryEditor({ category }: CategoryEditorProps) {
  const t = useTranslations('AdminCatalog.categories');
  const tFields = useTranslations('Admin.fields');
  const tStatus = useTranslations('Admin.status');
  const tRoot = useTranslations();
  const locale = useLocale() as 'en' | 'uk';
  const format = useFormatter();
  const router = useRouter();
  const notify = useSaveToast();
  const { withReauth } = useAdminSession();
  const applied = useRef<Applied | null>(null);
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const changeStatus = useChangeCategoryStatus();
  const remove = useDeleteCategory();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [inUse, setInUse] = useState<InUse | null>(null);
  const [deleteError, setDeleteError] = useState<AdminError | null>(null);

  const id = category?.id;

  const fetchLatest = useCallback(async () => {
    applied.current = null;
    const items = await fetchCategories();
    const latest = items.find((item) => item.id === id);
    if (!latest) throw new Error('missing');
    return {
      values: toValues(latest),
      revision: latest.revision,
      changedBy: latest.updatedBy?.login ?? null,
      changedAt: latest.updatedAt,
    };
  }, [id]);

  const form = useAdminForm<CategoryValues>({
    initial: category ? toValues(category) : emptyValues,
    revision: category?.revision ?? null,
    fetchLatest,
  });
  const { dialog, allowLeave } = useLeaveGuard(form.dirty, {
    fallbackHref: LIST_HREF,
  });
  const { values, initial, dirty, setField, submit } = form;
  const { mutateAsync: createAsync } = create;
  const { mutateAsync: updateAsync } = update;
  const { mutateAsync: statusAsync } = changeStatus;
  const { mutateAsync: removeAsync } = remove;

  const persist = useCallback(
    async (current: CategoryValues, revision: string | null) => {
      const body = {
        name: current.name,
        wastePercent: parseWaste(current.wastePercent),
        surface: current.surface,
        requiresPutty: current.requiresPutty,
      };
      if (!id) {
        const created = await withReauth(() => createAsync(body));
        return { revision: created.revision, values: toValues(created) };
      }
      const updated = await withReauth(() =>
        updateAsync({
          id,
          body: {
            ...body,
            revision: applied.current?.revision ?? revision ?? '',
          },
        }),
      );
      return { revision: updated.revision, values: toValues(updated) };
    },
    [id, withReauth, createAsync, updateAsync],
  );

  const onSave = useCallback(async () => {
    const affectsCost = costChanged(values, initial);
    const ok = await submit(persist);
    if (!ok) return;
    applied.current = null;
    notify({ affectsCost });
    if (!id) router.push(LIST_HREF);
  }, [values, initial, submit, persist, notify, id, router]);

  const moveTo = useCallback(
    async (status: Status) => {
      if (!id) return;
      const affectsCost = costChanged(values, initial);
      const ok = await submit(async (current, revision) => {
        if (status === 'PUBLISHED') requireTranslations(current.name);
        const prior = applied.current;
        let next = { revision, values: current };
        if (prior && isEqual(prior.submitted, current)) {
          next = prior;
        } else if (dirty || prior) {
          const saved = await persist(current, revision);
          applied.current = {
            revision: saved.revision,
            submitted: current,
            values: saved.values,
          };
          next = saved;
        }
        const changed = await withReauth(() =>
          statusAsync({
            id,
            body: { status, revision: next.revision ?? '' },
          }),
        );
        applied.current = null;
        return { revision: changed.revision, values: next.values };
      });
      if (ok) notify({ affectsCost });
    },
    [
      id,
      dirty,
      values,
      initial,
      submit,
      persist,
      withReauth,
      statusAsync,
      notify,
    ],
  );

  const status = category?.status;
  const onTogglePublication = useCallback(() => {
    void moveTo(status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED');
  }, [moveTo, status]);
  const onArchive = useCallback(() => void moveTo('ARCHIVED'), [moveTo]);
  const openDelete = useCallback(() => setConfirmingDelete(true), []);
  const closeDelete = useCallback(() => setConfirmingDelete(false), []);

  const onDelete = useCallback(async () => {
    if (!id) return;
    setConfirmingDelete(false);
    setDeleteError(null);
    const stay = allowLeave();
    try {
      await withReauth(() => removeAsync(id));
    } catch (failure) {
      stay();
      const error = toAdminError(failure);
      if (error.kind === 'inUse') setInUse(readInUse(error, locale));
      else setDeleteError(error);
      return;
    }
    notify();
    router.push(LIST_HREF);
  }, [id, withReauth, removeAsync, locale, notify, router, allowLeave]);

  const closeInUse = useCallback(() => setInUse(null), []);
  const archiveInstead = useCallback(async () => {
    setInUse(null);
    await moveTo('ARCHIVED');
  }, [moveTo]);

  const onNameChange = useCallback(
    (name: CategoryValues['name']) => setField('name', name),
    [setField],
  );
  const onWasteChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) =>
      setField('wastePercent', event.target.value),
    [setField],
  );
  const onSurfaceChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) =>
      setField('surface', event.target.value as CategoryValues['surface']),
    [setField],
  );
  const onPuttyChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) =>
      setField('requiresPutty', event.target.checked),
    [setField],
  );

  const roomTypes = useRoomTypes();
  const failure =
    form.error && form.error.kind !== 'stale' ? form.error : deleteError;
  const message = failure ? adminErrorMessage(failure) : null;

  const time = category
    ? format.dateTime(new Date(category.updatedAt), {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null;
  const roomTypeList = (codes: string[]) =>
    codes
      .map(
        (code) =>
          roomTypes.data?.find((roomType) => roomType.code === code)?.name[
            locale
          ] ?? code,
      )
      .join(', ');

  return (
    <div className={styles.root}>
      <div className={styles.titleRow}>
        <PageTitle>
          {category
            ? t('editTitle', { name: category.name[locale] })
            : t('newTitle')}
        </PageTitle>
        {category ? (
          <StatusBadge
            status={category.status}
            label={tStatus(category.status)}
          />
        ) : null}
      </div>
      {category && time ? (
        <p className={styles.meta}>
          {category.updatedBy
            ? t('form.lastChanged', { time, user: category.updatedBy.login })
            : t('form.lastChangedAnon', { time })}
        </p>
      ) : null}
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
      <div className={styles.form}>
        <LocalizedField
          key={form.resetKey}
          label={t('form.name')}
          value={values.name}
          onChange={onNameChange}
          languageLabels={{
            en: tFields('languages.en'),
            uk: tFields('languages.uk'),
          }}
          requiredForPublishLabel={tFields('requiredForPublish')}
          requiredForPublish
          errors={{ en: form.errors['name.en'], uk: form.errors['name.uk'] }}
        />
        <NumberField
          label={t('form.waste')}
          unit={t('form.wasteUnit')}
          hint={t('form.wasteHint')}
          error={form.errors.wastePercent}
          min={0}
          max={100}
          step="any"
          value={values.wastePercent}
          onChange={onWasteChange}
        />
        <Select
          label={t('form.surface')}
          value={values.surface}
          onChange={onSurfaceChange}
        >
          {SURFACES.map((surface) => (
            <option key={surface} value={surface}>
              {t(`surfaces.${surface}`)}
            </option>
          ))}
        </Select>
        <Checkbox
          label={t('form.requiresPutty')}
          checked={values.requiresPutty}
          onChange={onPuttyChange}
        />
      </div>
      <SaveBar
        dirty={dirty}
        saving={form.saving}
        onSave={onSave}
        publication={
          category
            ? {
                published: category.status === 'PUBLISHED',
                onToggle: onTogglePublication,
              }
            : undefined
        }
        onArchive={
          category && category.status !== 'ARCHIVED' ? onArchive : undefined
        }
        onDelete={category ? openDelete : undefined}
      />
      <ConfirmDialog
        open={confirmingDelete}
        title={t('delete.title')}
        description={t('delete.description')}
        confirmLabel={t('delete.confirm')}
        cancelLabel={t('delete.cancel')}
        closeLabel={t('delete.close')}
        tone="danger"
        onConfirm={onDelete}
        onCancel={closeDelete}
      />
      <ConfirmDialog
        open={inUse !== null}
        title={t('inUse.title')}
        description={
          inUse ? (
            <>
              <p>{t('inUse.intro')}</p>
              <ul className={styles.dependencies}>
                <li>{t('inUse.products', { count: inUse.productCount })}</li>
                {inUse.roomTypes.length > 0 ? (
                  <li>
                    {t('inUse.roomTypes', {
                      list: roomTypeList(inUse.roomTypes),
                    })}
                  </li>
                ) : null}
                {inUse.styles.length > 0 ? (
                  <li>
                    {t('inUse.styles', { list: inUse.styles.join(', ') })}
                  </li>
                ) : null}
              </ul>
            </>
          ) : null
        }
        confirmLabel={t('inUse.archive')}
        cancelLabel={t('inUse.cancel')}
        closeLabel={t('inUse.close')}
        onConfirm={archiveInstead}
        onCancel={closeInUse}
      />
      {dialog}
    </div>
  );
}
