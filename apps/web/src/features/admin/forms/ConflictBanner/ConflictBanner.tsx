'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { Banner, Button } from '@/components/ui';
import styles from './ConflictBanner.module.css';

export type ConflictBannerProps = {
  changedBy: string | null;
  changedAt: string | null;
  revealed: boolean;
  differingCount: number;
  onReveal: () => void;
  onAccept: () => void;
  onDismiss: () => void;
};

export function ConflictBanner({
  changedBy,
  changedAt,
  revealed,
  differingCount,
  onReveal,
  onAccept,
  onDismiss,
}: ConflictBannerProps) {
  const t = useTranslations('Admin.form.conflict');
  const format = useFormatter();
  const time = changedAt
    ? format.dateTime(new Date(changedAt), {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '';

  return (
    <Banner
      variant="warning"
      title={t('title', { user: changedBy ?? t('unknownUser'), time })}
      action={
        <div className={styles.actions}>
          {revealed ? null : (
            <Button kind="outline" onClick={onReveal}>
              {t('show')}
            </Button>
          )}
          <Button kind="fill" onClick={onAccept}>
            {t('accept')}
          </Button>
          <Button kind="outline" onClick={onDismiss}>
            {t('dismiss')}
          </Button>
        </div>
      }
    >
      {revealed ? t('revealed', { count: differingCount }) : t('keptMine')}
    </Banner>
  );
}
