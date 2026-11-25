'use client';

import { useTranslations } from 'next-intl';
import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import {
  Banner,
  LocalizedField,
  type LocalizedValue,
  Select,
  TextField,
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
  type AdminMaterialType,
  fetchMaterialTypes,
  useCreateMaterialType,
  useUpdateMaterialType,
} from '@/lib/admin-api/catalog';
import { adminErrorMessage } from '@/lib/admin-api/errors';
import styles from './AdminMaterialTypes.module.css';

type Status = AdminMaterialType['status'];

type Values = { code: string; name: LocalizedValue; status: Status };

const STATUSES: readonly Status[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

const RENDERED_FIELDS = ['code', 'name.en', 'name.uk', 'status'];

const EMPTY: Values = { code: '', name: { en: '', uk: '' }, status: 'DRAFT' };

const toValues = (item: AdminMaterialType): Values => ({
  code: item.code,
  name: { en: item.name.en, uk: item.name.uk },
  status: item.status,
});

type MaterialTypeFormProps = {
  item: AdminMaterialType | null;
  onSaved: () => void;
  onDirtyChange: (dirty: boolean) => void;
};

export function MaterialTypeForm({
  item,
  onSaved,
  onDirtyChange,
}: MaterialTypeFormProps) {
  const t = useTranslations('AdminCatalog.materialTypes');
  const tStatus = useTranslations('Admin.status');
  const tFields = useTranslations('Admin.fields');
  const tErrors = useTranslations('Errors');
  const tRoot = useTranslations();
  const { withReauth } = useAdminSession();
  const create = useCreateMaterialType();
  const update = useUpdateMaterialType();
  const notify = useSaveToast();
  const itemId = item?.id;

  const fetchLatest = useCallback(async () => {
    const latest = (await fetchMaterialTypes()).find(
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

  const initial = useMemo(() => (item ? toValues(item) : EMPTY), [item]);
  const form = useAdminForm<Values>({
    initial,
    revision: item?.revision ?? null,
    fetchLatest,
  });
  const { dialog } = useLeaveGuard(form.dirty);
  const { dirty } = form;

  useEffect(() => {
    onDirtyChange(dirty);
    return () => onDirtyChange(false);
  }, [dirty, onDirtyChange]);
  const { setField, submit } = form;
  const { mutateAsync: createAsync } = create;
  const { mutateAsync: updateAsync } = update;

  const save = useCallback(
    async (values: Values, revision: string | null) => {
      const saved = await withReauth(() =>
        item
          ? updateAsync({
              id: item.id,
              body: {
                name: values.name,
                status: values.status,
                revision: revision ?? item.revision,
              },
            })
          : createAsync({ code: values.code.trim(), name: values.name }),
      );
      return { revision: saved.revision, values: toValues(saved) };
    },
    [item, withReauth, createAsync, updateAsync],
  );

  const onSave = useCallback(() => {
    void submit(save).then((ok) => {
      if (!ok) return;
      notify();
      onSaved();
    });
  }, [submit, save, notify, onSaved]);

  const onSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      onSave();
    },
    [onSave],
  );

  const onCodeChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) =>
      setField('code', event.target.value),
    [setField],
  );
  const onNameChange = useCallback(
    (name: LocalizedValue) => setField('name', name),
    [setField],
  );
  const onStatusChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) =>
      setField('status', event.target.value as Status),
    [setField],
  );

  const failure = form.error;
  const codeTaken = failure?.kind === 'other' && failure.code === 'CODE_TAKEN';
  const message =
    failure !== null &&
    failure.kind !== 'stale' &&
    !codeTaken &&
    (failure.kind !== 'validation' ||
      failure.fields.some((field) => !RENDERED_FIELDS.includes(field.path)))
      ? adminErrorMessage(failure)
      : null;

  const languageLabels = {
    en: tFields('languages.en'),
    uk: tFields('languages.uk'),
  };

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
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
      <TextField
        label={t('code')}
        value={form.values.code}
        hint={item ? undefined : t('codeHint')}
        required
        disabled={item !== null}
        error={
          form.errors.code ?? (codeTaken ? tErrors('CODE_TAKEN') : undefined)
        }
        onChange={onCodeChange}
      />
      <LocalizedField
        key={form.resetKey}
        label={t('name')}
        value={form.values.name}
        languageLabels={languageLabels}
        requiredForPublishLabel={tFields('requiredForPublish')}
        requiredForPublish={form.values.status === 'PUBLISHED'}
        errors={{ en: form.errors['name.en'], uk: form.errors['name.uk'] }}
        onChange={onNameChange}
      />
      {item ? (
        <Select
          label={t('status')}
          value={form.values.status}
          error={form.errors.status}
          onChange={onStatusChange}
        >
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {tStatus(status)}
            </option>
          ))}
        </Select>
      ) : null}
      <SaveBar dirty={form.dirty} saving={form.saving} onSave={onSave} />
      {dialog}
    </form>
  );
}
