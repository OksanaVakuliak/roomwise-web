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
import { adminErrorMessage, toAdminError } from '@/lib/admin-api/errors';
import { useProduct } from '@/lib/admin-api/products';
import { ApiRequestError } from '@/lib/api/request-error';
import { ProductEditor } from './ProductEditor';
import styles from './ProductForm.module.css';

export type ProductFormProps = { productId?: string };

export function ProductForm({ productId }: ProductFormProps) {
  const t = useTranslations('AdminCatalog.products.form');
  const tRoot = useTranslations();
  const query = useProduct(productId);
  const { refetch } = query;
  const retry = useCallback(() => void refetch(), [refetch]);

  if (productId === undefined) return <ProductEditor />;

  if (query.error instanceof ApiRequestError && query.error.status === 404) {
    return (
      <div className={styles.root}>
        <PageTitle>{t('title')}</PageTitle>
        <EmptyState
          title={t('notFoundTitle')}
          text={t('notFoundText')}
          action={
            <ButtonLink kind="outline" href="/admin/catalog/products">
              {t('back')}
            </ButtonLink>
          }
        />
      </div>
    );
  }

  if (query.error && !query.data) {
    const message = adminErrorMessage(toAdminError(query.error));
    return (
      <div className={styles.root}>
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
      </div>
    );
  }

  if (query.isPending) {
    return (
      <div className={styles.root}>
        <div role="status" aria-label={t('loading')}>
          <Skeleton variant="block" height="3rem" />
        </div>
      </div>
    );
  }

  return <ProductEditor product={query.data} />;
}
