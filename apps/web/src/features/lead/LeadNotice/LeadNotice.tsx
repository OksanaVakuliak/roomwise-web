'use client';

import type { UseQueryResult } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ErrorState } from '@/components/system';
import { Banner, Skeleton, VisuallyHidden } from '@/components/ui';
import type { LeadFormSettings } from '@/lib/api/leads';
import styles from './LeadNotice.module.css';

const FIELD_KEYS = ['name', 'phone', 'email', 'comment', 'consent'] as const;
const FIELD_HEIGHTS = [
  'var(--size-target)',
  'var(--size-target)',
  'var(--size-target)',
  'calc(var(--size-target) * 2)',
  'var(--size-target)',
] as const;

export type LeadNoticeProps = {
  settings: Pick<
    UseQueryResult<LeadFormSettings>,
    'data' | 'isError' | 'refetch'
  >;
};

export function LeadNotice({ settings }: LeadNoticeProps) {
  const t = useTranslations('Lead');

  if (settings.data) {
    return <Banner variant="warning">{settings.data.notice}</Banner>;
  }
  if (settings.isError) {
    return (
      <ErrorState
        headingLevel={3}
        title={t('settingsError.title')}
        message={t('settingsError.message')}
        onRetry={settings.refetch}
      />
    );
  }
  return (
    <>
      <div role="status" className={styles.loading}>
        <Skeleton />
        <Skeleton width="60%" />
        <VisuallyHidden>{t('loading')}</VisuallyHidden>
      </div>
      <div className={styles.form} aria-hidden="true">
        {FIELD_HEIGHTS.map((height, index) => (
          <div key={FIELD_KEYS[index]} className={styles.field}>
            <Skeleton width="30%" />
            <Skeleton variant="block" height={height} />
            <div className={styles.messages} />
          </div>
        ))}
        <Skeleton variant="block" width="40%" height="var(--size-button)" />
      </div>
    </>
  );
}
