'use client';

import type { UseQueryResult } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ErrorState } from '@/components/system';
import { Banner, Skeleton, VisuallyHidden } from '@/components/ui';
import type { LeadFormSettings } from '@/lib/api/leads';
import styles from './LeadNotice.module.css';

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
    <div role="status" className={styles.loading}>
      <Skeleton variant="block" />
      <VisuallyHidden>{t('loading')}</VisuallyHidden>
    </div>
  );
}
