'use client';

import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import {
  Banner,
  Button,
  ButtonLink,
  EmptyState,
  PageTitle,
  Skeleton,
} from '@/components/ui';
import { useCategory } from '@/lib/admin-api/catalog';
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

  if (query.data === null) {
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

  return <CategoryEditor category={query.data} />;
}
