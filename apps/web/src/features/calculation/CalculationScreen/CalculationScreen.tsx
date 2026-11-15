'use client';

import type { UseQueryResult } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { type ReactNode, useCallback } from 'react';
import { ErrorState } from '@/components/system';
import { Skeleton } from '@/components/ui';
import {
  useCalculationVersion,
  useLatestCalculation,
  type VersionView,
} from '@/lib/api/calculations';
import { ApiRequestError } from '@/lib/api/request-error';
import { CalculationNotFound } from '../CalculationNotFound/CalculationNotFound';
import { CalculationPage } from '../CalculationPage/CalculationPage';
import { isPublicId, parseVersionNumber } from '../version-number';
import styles from './CalculationScreen.module.css';

const SKELETON_ROWS = [0, 1, 2] as const;

export type CalculationSlots = {
  notices?: (version: VersionView) => ReactNode;
  badge?: (version: VersionView) => ReactNode;
  versions?: (version: VersionView) => ReactNode;
  actions?: (version: VersionView) => ReactNode;
};

export type CalculationScreenProps = CalculationSlots & {
  publicId: string;
  versionNumber?: string;
};

type ViewProps = CalculationSlots & { query: UseQueryResult<VersionView> };

function isNotFound(error: unknown): boolean {
  return (
    error instanceof ApiRequestError &&
    error.status === 404 &&
    error.apiError.code === 'CALCULATION_NOT_FOUND'
  );
}

function CalculationView({
  query,
  notices,
  badge,
  versions,
  actions,
}: ViewProps) {
  const t = useTranslations('CalculationPage');
  const { refetch } = query;
  const retry = useCallback(() => refetch(), [refetch]);

  if (query.isError) {
    return isNotFound(query.error) ? (
      <CalculationNotFound />
    ) : (
      <ErrorState headingLevel={2} onRetry={retry} />
    );
  }

  if (!query.data) {
    return (
      <div className={styles.root} role="status" aria-label={t('loading')}>
        <Skeleton width="70%" />
        <section className={styles.total}>
          <div className={styles.bar}>
            <Skeleton width="50%" height="var(--text-number-l-line)" />
          </div>
          <div className={styles.details}>
            {SKELETON_ROWS.map((key) => (
              <Skeleton key={key} />
            ))}
          </div>
        </section>
        <div className={styles.rows}>
          {SKELETON_ROWS.map((key) => (
            <Skeleton key={key} />
          ))}
        </div>
        <div className={styles.actions}>
          <Skeleton variant="block" width="40%" height="var(--size-button)" />
        </div>
      </div>
    );
  }

  const version = query.data;

  return (
    <CalculationPage
      version={version}
      notices={notices?.(version)}
      badge={badge?.(version)}
      versions={versions?.(version)}
      actions={actions?.(version)}
    />
  );
}

function LatestCalculation({
  publicId,
  ...slots
}: CalculationSlots & { publicId: string }) {
  const query = useLatestCalculation(publicId);
  return <CalculationView query={query} {...slots} />;
}

function VersionCalculation({
  publicId,
  number,
  ...slots
}: CalculationSlots & { publicId: string; number: number }) {
  const query = useCalculationVersion(publicId, number);
  return <CalculationView query={query} {...slots} />;
}

export function CalculationScreen({
  publicId,
  versionNumber,
  ...slots
}: CalculationScreenProps) {
  if (!isPublicId(publicId)) {
    return <CalculationNotFound />;
  }

  if (versionNumber === undefined) {
    return <LatestCalculation publicId={publicId} {...slots} />;
  }

  const number = parseVersionNumber(versionNumber);

  if (number === null) {
    return <CalculationNotFound />;
  }

  return <VersionCalculation publicId={publicId} number={number} {...slots} />;
}
