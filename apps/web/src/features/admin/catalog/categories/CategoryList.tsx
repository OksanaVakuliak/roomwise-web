'use client';

import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { type ChangeEvent, useCallback, useMemo } from 'react';
import {
  ButtonLink,
  type DataTableColumn,
  PageTitle,
  Select,
  StatusBadge,
} from '@/components/ui';
import {
  AdminList,
  type ListSchema,
  useListParams,
} from '@/features/admin/lists';
import { Link, useRouter } from '@/i18n/navigation';
import { type AdminCategory, useCategories } from '@/lib/admin-api/catalog';
import styles from './CategoryList.module.css';

const PAGE_SIZE = 20;
const STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;

const schema = {
  search: true,
  filters: { status: STATUSES },
  sortKeys: ['name', 'waste', 'products', 'updated'],
  defaultSort: { key: 'name', dir: 'asc' },
} as const satisfies ListSchema;

const categoryHref = (id: string) => `/admin/catalog/categories/${id}`;

export function CategoryList() {
  const t = useTranslations('AdminCatalog.categories');
  const tStatus = useTranslations('Admin.status');
  const locale = useLocale() as 'en' | 'uk';
  const format = useFormatter();
  const router = useRouter();
  const list = useListParams(schema);
  const query = useCategories();
  const { params, setFilter } = list;

  const rows = useMemo(() => {
    const needle = params.q.toLowerCase();
    const filtered = (query.data ?? []).filter(
      (category) =>
        (!params.filters.status || category.status === params.filters.status) &&
        (!needle ||
          `${category.name.en} ${category.name.uk}`
            .toLowerCase()
            .includes(needle)),
    );
    const sort = params.sort ?? schema.defaultSort;
    const factor = sort.dir === 'asc' ? 1 : -1;
    const compare = (a: AdminCategory, b: AdminCategory) => {
      switch (sort.key) {
        case 'waste':
          return a.wastePercent - b.wastePercent;
        case 'products':
          return a.productCount - b.productCount;
        case 'updated':
          return a.updatedAt.localeCompare(b.updatedAt);
        default:
          return a.name[locale].localeCompare(b.name[locale], locale);
      }
    };
    return [...filtered].sort((a, b) => factor * compare(a, b));
  }, [query.data, params.q, params.filters.status, params.sort, locale]);

  const pageRows = useMemo(
    () => rows.slice((params.page - 1) * PAGE_SIZE, params.page * PAGE_SIZE),
    [rows, params.page],
  );

  const columns = useMemo<DataTableColumn<AdminCategory>[]>(
    () => [
      {
        key: 'name',
        header: t('columns.name'),
        rowHeader: true,
        sortable: true,
        cell: (row) => (
          <Link href={categoryHref(row.id)}>{row.name[locale]}</Link>
        ),
      },
      {
        key: 'surface',
        header: t('columns.surface'),
        cell: (row) => t(`surfaces.${row.surface}`),
      },
      {
        key: 'waste',
        header: t('columns.waste'),
        numeric: true,
        sortable: true,
        cell: (row) => row.wastePercent,
      },
      {
        key: 'status',
        header: t('columns.status'),
        cell: (row) => (
          <StatusBadge status={row.status} label={tStatus(row.status)} />
        ),
      },
      {
        key: 'products',
        header: t('columns.products'),
        numeric: true,
        sortable: true,
        cell: (row) => row.productCount,
      },
      {
        key: 'updated',
        header: t('columns.updated'),
        sortable: true,
        cell: (row) =>
          format.dateTime(new Date(row.updatedAt), { dateStyle: 'medium' }),
      },
    ],
    [t, tStatus, locale, format],
  );

  const getRowKey = useCallback((row: AdminCategory) => row.id, []);
  const onRowClick = useCallback(
    (row: AdminCategory) => router.push(categoryHref(row.id)),
    [router],
  );
  const refetch = useCallback(() => void query.refetch(), [query]);
  const onStatusChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) =>
      setFilter('status', event.target.value),
    [setFilter],
  );

  const addLink = (
    <ButtonLink href="/admin/catalog/categories/new">{t('add')}</ButtonLink>
  );

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <PageTitle>{t('title')}</PageTitle>
        {addLink}
      </div>
      <AdminList
        list={list}
        caption={t('caption')}
        searchLabel={t('search')}
        columns={columns}
        getRowKey={getRowKey}
        rows={pageRows}
        total={rows.length}
        pageSize={PAGE_SIZE}
        isLoading={query.isPending}
        error={query.error}
        refetch={refetch}
        empty={{
          title: t('empty.title'),
          text: t('empty.text'),
          action: addLink,
        }}
        onRowClick={onRowClick}
        filters={
          <Select
            label={t('statusFilter')}
            value={params.filters.status ?? ''}
            onChange={onStatusChange}
          >
            <option value="">{t('allStatuses')}</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {tStatus(status)}
              </option>
            ))}
          </Select>
        }
      />
    </div>
  );
}
