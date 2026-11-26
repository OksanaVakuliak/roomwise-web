'use client';

import { useLocale, useTranslations } from 'next-intl';
import { type ChangeEvent, useCallback, useMemo } from 'react';
import {
  ButtonLink,
  type DataTableColumn,
  ImageWithFallback,
  Link,
  PageTitle,
  Price,
  Select,
  StatusBadge,
} from '@/components/ui';
import {
  AdminList,
  type ListSchema,
  useListParams,
} from '@/features/admin/lists';
import { useRouter } from '@/i18n/navigation';
import { useCategories } from '@/lib/admin-api/catalog';
import {
  type AdminProductRow,
  type ProductStatus,
  useProducts,
} from '@/lib/admin-api/products';
import { localDate } from '@/lib/format';
import styles from './ProductList.module.css';

const PAGE_SIZE = 20;
const STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;

const schema = {
  search: true,
  filters: { categoryId: 'any', status: STATUSES },
} as const satisfies ListSchema;

const getRowKey = (row: AdminProductRow) => row.id;

export function ProductList() {
  const t = useTranslations('AdminCatalog.products.list');
  const tStatus = useTranslations('Admin.status');
  const locale = useLocale() as 'en' | 'uk';
  const router = useRouter();
  const list = useListParams(schema);
  const { setFilter } = list;
  const { q, page, filters } = list.params;
  const { categoryId, status } = filters;

  const products = useProducts({
    q: q || undefined,
    categoryId,
    status: status as ProductStatus | undefined,
    page,
    pageSize: PAGE_SIZE,
  });
  const { refetch } = products;
  const categories = useCategories();

  const categoryNames = useMemo(
    () =>
      new Map(
        (categories.data ?? []).map((item) => [item.id, item.name[locale]]),
      ),
    [categories.data, locale],
  );

  const columns = useMemo<DataTableColumn<AdminProductRow>[]>(
    () => [
      {
        key: 'image',
        header: t('columns.image'),
        cell: (row) => (
          <span className={styles.thumb}>
            <ImageWithFallback
              src={row.image?.thumb}
              name={row.name[locale] || row.name.en}
              ratio="1"
            />
          </span>
        ),
      },
      {
        key: 'name',
        header: t('columns.name'),
        rowHeader: true,
        cell: (row) => (
          <Link
            href={`/admin/catalog/products/${row.id}`}
            className={styles.name}
          >
            {row.name[locale] || row.name.en}
          </Link>
        ),
      },
      {
        key: 'category',
        header: t('columns.category'),
        cell: (row) => categoryNames.get(row.categoryId) ?? '—',
      },
      {
        key: 'price',
        header: t('columns.price'),
        numeric: true,
        cell: (row) => (
          <Price cents={row.priceCents} currency="USD" locale={locale} />
        ),
      },
      {
        key: 'status',
        header: t('columns.status'),
        cell: (row) => (
          <StatusBadge status={row.status} label={tStatus(row.status)} />
        ),
      },
      {
        key: 'updated',
        header: t('columns.updated'),
        cell: (row) => localDate(row.updatedAt, locale),
      },
    ],
    [t, tStatus, locale, categoryNames],
  );

  const handleCategory = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) =>
      setFilter('categoryId', event.target.value),
    [setFilter],
  );
  const handleStatus = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) =>
      setFilter('status', event.target.value),
    [setFilter],
  );
  const handleRowClick = useCallback(
    (row: AdminProductRow) => router.push(`/admin/catalog/products/${row.id}`),
    [router],
  );
  const handleRefetch = useCallback(() => {
    void refetch();
  }, [refetch]);

  const newProduct = (
    <ButtonLink href="/admin/catalog/products/new">{t('new')}</ButtonLink>
  );

  const filterControls = (
    <>
      <Select
        label={t('filters.category')}
        value={categoryId ?? ''}
        onChange={handleCategory}
      >
        <option value="">{t('filters.allCategories')}</option>
        {(categories.data ?? []).map((item) => (
          <option key={item.id} value={item.id}>
            {item.name[locale]}
          </option>
        ))}
      </Select>
      <Select
        label={t('filters.status')}
        value={status ?? ''}
        onChange={handleStatus}
      >
        <option value="">{t('filters.allStatuses')}</option>
        {STATUSES.map((value) => (
          <option key={value} value={value}>
            {tStatus(value)}
          </option>
        ))}
      </Select>
    </>
  );

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <PageTitle>{t('title')}</PageTitle>
        {newProduct}
      </div>
      <AdminList
        list={list}
        caption={t('caption')}
        columns={columns}
        getRowKey={getRowKey}
        rows={products.data?.items ?? []}
        total={products.data?.total ?? 0}
        pageSize={PAGE_SIZE}
        isLoading={products.isPending}
        error={products.error}
        refetch={handleRefetch}
        empty={{
          title: t('empty.title'),
          text: t('empty.text'),
          action: newProduct,
        }}
        filters={filterControls}
        searchLabel={t('search')}
        onRowClick={handleRowClick}
      />
    </div>
  );
}
