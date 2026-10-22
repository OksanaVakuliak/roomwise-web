'use client';

import { useTranslations } from 'next-intl';
import { Button, EmptyState } from '@/components/ui';
import { useRetry } from '../useRetry';
import styles from './ErrorState.module.css';

export type ErrorStateProps = {
  onRetry: () => void | Promise<unknown>;
  title?: string;
  message?: string;
  headingLevel?: 2 | 3 | 4;
};

export function ErrorState({
  onRetry,
  title,
  message,
  headingLevel,
}: ErrorStateProps) {
  const t = useTranslations('SystemStates');
  const { pending, retry } = useRetry(onRetry);

  return (
    <div role="alert" className={styles.root}>
      <EmptyState
        icon="warning"
        title={title ?? t('errorTitle')}
        text={message ?? t('errorMessage')}
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
