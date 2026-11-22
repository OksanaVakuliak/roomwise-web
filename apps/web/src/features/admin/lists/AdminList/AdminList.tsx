'use client';

import { useTranslations } from 'next-intl';
import { type ReactNode, useCallback, useEffect } from 'react';
import {
  Banner,
  Button,
  DataTable,
  type DataTableColumn,
  EmptyState,
  FilterBar,
  Pagination,
  SearchField,
  Skeleton,
} from '@/components/ui';
import { adminErrorMessage, toAdminError } from '@/lib/admin-api/errors';
import type { ListParamsApi, ListSchema } from '../use-list-params';
import styles from './AdminList.module.css';

const SKELETON_ROWS = 5;

export type AdminListEmpty = {
  title: ReactNode;
  text?: ReactNode;
  action?: ReactNode;
};

export type AdminListProps<Row, S extends ListSchema> = {
  list: ListParamsApi<S>;
  caption: ReactNode;
  columns: readonly DataTableColumn<Row>[];
  getRowKey: (row: Row) => string;
  rows: readonly Row[];
  total: number;
  pageSize: number;
  isLoading?: boolean;
  error?: unknown;
  refetch: () => void;
  empty: AdminListEmpty;
  filters?: ReactNode;
  searchLabel?: string;
  onRowClick?: (row: Row) => void;
};

export function AdminList<Row, S extends ListSchema>({
  list,
  caption,
  columns,
  getRowKey,
  rows,
  total,
  pageSize,
  isLoading = false,
  error,
  refetch,
  empty,
  filters,
  searchLabel,
  onRowClick,
}: AdminListProps<Row, S>) {
  const t = useTranslations('Admin.list');
  const tRoot = useTranslations();
  const { params, setPage, setSort } = list;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const failed = error !== undefined && error !== null;

  useEffect(() => {
    if (!failed && !isLoading && total > 0 && params.page > pageCount) {
      setPage(pageCount);
    }
  }, [failed, isLoading, total, params.page, pageCount, setPage]);

  const getPageLabel = useCallback((page: number) => t('page', { page }), [t]);

  const handleRetry = useCallback(() => refetch(), [refetch]);

  const toolbar = (
    <div className={styles.toolbar}>
      {list.hasSearch ? (
        <SearchField
          key={list.searchKey}
          label={searchLabel ?? t('search')}
          defaultValue={params.q}
          clearLabel={t('clearSearch')}
          onSearch={list.setQuery}
        />
      ) : null}
      {filters ? (
        <FilterBar
          onReset={list.isFiltered ? list.reset : undefined}
          resetLabel={t('resetFilters')}
          toggleLabel={t('filters')}
        >
          {filters}
        </FilterBar>
      ) : null}
    </div>
  );

  let body: ReactNode;
  if (failed) {
    const message = adminErrorMessage(toAdminError(error));
    body = (
      <Banner
        variant="error"
        title={t('errorTitle')}
        action={<Button onClick={handleRetry}>{t('retry')}</Button>}
      >
        {tRoot(
          `${message.namespace}.${message.key}` as never,
          message.values as never,
        )}
      </Banner>
    );
  } else if (isLoading) {
    body = (
      <div className={styles.skeleton} role="status" aria-label={t('loading')}>
        {Array.from({ length: SKELETON_ROWS }, (_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
          <Skeleton key={index} variant="block" height="3rem" />
        ))}
      </div>
    );
  } else if (rows.length === 0) {
    body = list.isFiltered ? (
      <EmptyState
        title={t('noMatchesTitle')}
        text={t('noMatchesText')}
        action={
          <Button kind="outline" onClick={list.reset}>
            {t('resetFilters')}
          </Button>
        }
      />
    ) : (
      <EmptyState title={empty.title} text={empty.text} action={empty.action} />
    );
  } else {
    body = (
      <>
        <DataTable
          caption={caption}
          columns={columns}
          rows={rows}
          getRowKey={getRowKey}
          layout="auto"
          sort={params.sort}
          onSortChange={setSort}
          onRowClick={onRowClick}
        />
        <div className={styles.footer}>
          <Pagination
            page={Math.min(params.page, pageCount)}
            pageCount={pageCount}
            onPageChange={setPage}
            label={t('pagination')}
            prevLabel={t('previousPage')}
            nextLabel={t('nextPage')}
            getPageLabel={getPageLabel}
          />
        </div>
      </>
    );
  }

  return (
    <div className={styles.root}>
      {toolbar}
      {body}
    </div>
  );
}
