'use client';

import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { type ReactNode, useCallback, useMemo } from 'react';
import {
  Banner,
  Button,
  DataTable,
  type DataTableColumn,
  PageTitle,
  Skeleton,
} from '@/components/ui';
import { Link, useRouter } from '@/i18n/navigation';
import { type AdminRoomType, useRoomTypes } from '@/lib/admin-api/catalog';
import { adminErrorMessage, toAdminError } from '@/lib/admin-api/errors';
import styles from './RoomTypeList.module.css';

const SKELETON_KEYS = ['s1', 's2', 's3', 's4', 's5', 's6', 's7'] as const;

const roomTypeHref = (code: string) => `/admin/catalog/room-types/${code}`;

export function RoomTypeList() {
  const t = useTranslations('AdminCatalog.roomTypes');
  const tList = useTranslations('Admin.list');
  const tRoot = useTranslations();
  const locale = useLocale() as 'en' | 'uk';
  const format = useFormatter();
  const router = useRouter();
  const query = useRoomTypes();
  const { refetch } = query;

  const columns = useMemo<DataTableColumn<AdminRoomType>[]>(
    () => [
      {
        key: 'name',
        header: t('columns.name'),
        rowHeader: true,
        cell: (row) => (
          <Link href={roomTypeHref(row.code)}>{row.name[locale]}</Link>
        ),
      },
      {
        key: 'categories',
        header: t('columns.categories'),
        numeric: true,
        cell: (row) => row.categories.length,
      },
      {
        key: 'updated',
        header: t('columns.updated'),
        cell: (row) =>
          format.dateTime(new Date(row.updatedAt), { dateStyle: 'medium' }),
      },
    ],
    [t, locale, format],
  );

  const getRowKey = useCallback((row: AdminRoomType) => row.id, []);
  const onRowClick = useCallback(
    (row: AdminRoomType) => router.push(roomTypeHref(row.code)),
    [router],
  );
  const retry = useCallback(() => void refetch(), [refetch]);

  let body: ReactNode;
  if (query.error) {
    const message = adminErrorMessage(toAdminError(query.error));
    body = (
      <Banner
        variant="error"
        title={tList('errorTitle')}
        action={<Button onClick={retry}>{tList('retry')}</Button>}
      >
        {tRoot(
          `${message.namespace}.${message.key}` as never,
          message.values as never,
        )}
      </Banner>
    );
  } else if (query.isPending) {
    body = (
      <div
        className={styles.skeleton}
        role="status"
        aria-label={tList('loading')}
      >
        {SKELETON_KEYS.map((key) => (
          <Skeleton key={key} variant="block" height="3rem" />
        ))}
      </div>
    );
  } else {
    body = (
      <DataTable
        caption={t('caption')}
        columns={columns}
        rows={query.data}
        getRowKey={getRowKey}
        layout="auto"
        onRowClick={onRowClick}
      />
    );
  }

  return (
    <div className={styles.root}>
      <PageTitle>{t('title')}</PageTitle>
      {body}
    </div>
  );
}
