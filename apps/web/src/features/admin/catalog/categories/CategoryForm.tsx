'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useRef, useState } from 'react';
import {
  Banner,
  Button,
  ButtonLink,
  EmptyState,
  PageTitle,
  Skeleton,
} from '@/components/ui';
import { type AdminCategory, useCategory } from '@/lib/admin-api/catalog';
import { adminErrorMessage, toAdminError } from '@/lib/admin-api/errors';
import { CategoryEditor } from './CategoryEditor';
import styles from './CategoryForm.module.css';

export type CategoryFormProps = { categoryId?: string };

export function CategoryForm({ categoryId }: CategoryFormProps) {
  const t = useTranslations('AdminCatalog.categories');
  const tRoot = useTranslations();
  const query = useCategory(categoryId);
  const { refetch } = query;
  const retry = useCallback(() => void refetch(), [refetch]);
  const lastSeen = useRef<{ id: string; data: AdminCategory } | null>(null);
  const [deleting, setDeleting] = useState(false);
  if (query.data && categoryId !== undefined) {
    lastSeen.current = { id: categoryId, data: query.data };
  }

  if (categoryId === undefined) return <CategoryEditor />;

  if (query.error && query.data === undefined) {
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

  const category =
    query.data ??
    (lastSeen.current?.id === categoryId ? lastSeen.current.data : null);
  if (!category) {
    return (
      <div className={styles.root}>
        <PageTitle>{t('title')}</PageTitle>
        <EmptyState
          title={t('form.notFoundTitle')}
          text={t('form.notFoundText')}
          action={
            <ButtonLink kind="outline" href="/admin/catalog/categories">
              {t('form.back')}
            </ButtonLink>
          }
        />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {query.data === null && !deleting ? (
        <Banner variant="warning" title={t('form.deletedElsewhereTitle')}>
          {t('form.deletedElsewhereText')}
        </Banner>
      ) : null}
      <CategoryEditor category={category} onDeleting={setDeleting} />
    </div>
  );
}
