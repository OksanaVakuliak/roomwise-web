'use client';

import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';
import {
  Banner,
  Button,
  ConfirmDialog,
  DataTable,
  type DataTableColumn,
  EmptyState,
  PageTitle,
  SearchField,
  SidePanel,
  Skeleton,
  StatusBadge,
  VisuallyHidden,
} from '@/components/ui';
import {
  type AdminMaterialType,
  useMaterialTypes,
} from '@/lib/admin-api/catalog';
import { adminErrorMessage, toAdminError } from '@/lib/admin-api/errors';
import styles from './AdminMaterialTypes.module.css';
import { EditButton } from './EditButton';
import { MaterialTypeForm } from './MaterialTypeForm';

const SKELETON_KEYS = ['s1', 's2', 's3', 's4'] as const;

type Panel = { kind: 'create' } | { kind: 'edit'; item: AdminMaterialType };

const matches = (item: AdminMaterialType, query: string) =>
  [item.code, item.name.en, item.name.uk].some((value) =>
    value.toLowerCase().includes(query),
  );

export function AdminMaterialTypes() {
  const t = useTranslations('AdminCatalog.materialTypes');
  const tStatus = useTranslations('Admin.status');
  const tRoot = useTranslations();
  const format = useFormatter();
  const lang = useLocale() as 'en' | 'uk';
  const query = useMaterialTypes();
  const { refetch } = query;
  const [search, setSearch] = useState('');
  const tLeave = useTranslations('Admin.form.leave');
  const [panel, setPanel] = useState<Panel | null>(null);
  const [panelDirty, setPanelDirty] = useState(false);
  const [confirmingClose, setConfirmingClose] = useState(false);

  const openCreate = useCallback(() => setPanel({ kind: 'create' }), []);
  const openEdit = useCallback(
    (item: AdminMaterialType) => setPanel({ kind: 'edit', item }),
    [],
  );
  const closePanel = useCallback(() => {
    setConfirmingClose(false);
    setPanel(null);
  }, []);
  const requestClose = useCallback(() => {
    if (panelDirty) setConfirmingClose(true);
    else closePanel();
  }, [panelDirty, closePanel]);
  const stayInPanel = useCallback(() => setConfirmingClose(false), []);
  const retry = useCallback(() => {
    void refetch();
  }, [refetch]);

  const normalized = search.trim().toLowerCase();
  const items = query.data;
  const rows = useMemo(
    () =>
      (items ?? []).filter(
        (item) => normalized === '' || matches(item, normalized),
      ),
    [items, normalized],
  );

  const columns = useMemo<DataTableColumn<AdminMaterialType>[]>(
    () => [
      {
        key: 'code',
        header: t('columnCode'),
        rowHeader: true,
        cell: (row) => row.code,
      },
      {
        key: 'name',
        header: t('columnName'),
        cell: (row) => row.name[lang],
      },
      {
        key: 'status',
        header: t('columnStatus'),
        cell: (row) => (
          <StatusBadge status={row.status} label={tStatus(row.status)} />
        ),
      },
      {
        key: 'updatedAt',
        header: t('columnUpdated'),
        cell: (row) =>
          format.dateTime(new Date(row.updatedAt), { dateStyle: 'medium' }),
      },
      {
        key: 'actions',
        header: <VisuallyHidden>{t('columnActions')}</VisuallyHidden>,
        cell: (row) => (
          <EditButton
            item={row}
            label={t('edit', { code: row.code })}
            onEdit={openEdit}
          />
        ),
      },
    ],
    [t, tStatus, format, lang, openEdit],
  );

  let body;
  if (query.error && !query.data) {
    const message = adminErrorMessage(toAdminError(query.error));
    body = (
      <Banner
        variant="error"
        title={t('loadFailed')}
        action={<Button onClick={retry}>{t('retry')}</Button>}
      >
        {tRoot(
          `${message.namespace}.${message.key}` as never,
          message.values as never,
        )}
      </Banner>
    );
  } else if (query.isLoading || !items) {
    body = (
      <div className={styles.skeleton} role="status" aria-label={t('loading')}>
        {SKELETON_KEYS.map((key) => (
          <Skeleton key={key} variant="block" height="3rem" />
        ))}
      </div>
    );
  } else if (items.length === 0) {
    body = <EmptyState title={t('emptyTitle')} text={t('emptyText')} />;
  } else if (rows.length === 0) {
    body = <EmptyState title={t('noMatchesTitle')} text={t('noMatchesText')} />;
  } else {
    body = (
      <DataTable
        caption={t('caption')}
        columns={columns}
        rows={rows}
        getRowKey={getRowKey}
        layout="auto"
      />
    );
  }

  return (
    <div className={styles.root}>
      <PageTitle>{t('title')}</PageTitle>
      <div className={styles.toolbar}>
        <SearchField
          label={t('search')}
          clearLabel={tRoot('Admin.list.clearSearch')}
          onSearch={setSearch}
        />
        <Button kind="fill" onClick={openCreate}>
          {t('add')}
        </Button>
      </div>
      {body}
      <SidePanel
        open={panel !== null}
        onClose={requestClose}
        title={panel?.kind === 'edit' ? t('editTitle') : t('createTitle')}
        closeLabel={t('close')}
      >
        {panel ? (
          <MaterialTypeForm
            key={panel.kind === 'edit' ? panel.item.id : 'create'}
            item={panel.kind === 'edit' ? panel.item : null}
            onSaved={closePanel}
            onDirtyChange={setPanelDirty}
          />
        ) : null}
      </SidePanel>
      <ConfirmDialog
        open={confirmingClose}
        title={tLeave('title')}
        description={tLeave('description')}
        confirmLabel={tLeave('confirm')}
        cancelLabel={tLeave('cancel')}
        closeLabel={tLeave('close')}
        tone="danger"
        onConfirm={closePanel}
        onCancel={stayInPanel}
      />
    </div>
  );
}

function getRowKey(row: AdminMaterialType) {
  return row.id;
}
