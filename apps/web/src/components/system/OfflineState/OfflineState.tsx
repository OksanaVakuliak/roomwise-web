'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { Button, EmptyState } from '@/components/ui';
import { useRetry } from '../useRetry';
import styles from './OfflineState.module.css';

export type OfflineStateProps = {
  onRetry: () => void | Promise<unknown>;
  headingLevel?: 2 | 3 | 4;
};

export function OfflineState({ onRetry, headingLevel }: OfflineStateProps) {
  const t = useTranslations('SystemStates');
  const { pending, retry } = useRetry(onRetry);

  useEffect(() => {
    window.addEventListener('online', retry);
    return () => window.removeEventListener('online', retry);
  }, [retry]);

  return (
    <div role="status" className={styles.root}>
      <EmptyState
        icon="link"
        title={t('offlineTitle')}
        text={t('offlineMessage')}
        headingLevel={headingLevel}
        action={
          <Button
            kind="fill"
            loading={pending}
            loadingLabel={t('retrying')}
            onClick={retry}
          >
            {t('retry')}
          </Button>
        }
      />
    </div>
  );
}
