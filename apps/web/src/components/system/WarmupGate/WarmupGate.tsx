'use client';

import { useTranslations } from 'next-intl';
import { type ReactNode, useEffect, useState } from 'react';
import { EmptyState, Progress } from '@/components/ui';
import {
  retryWarmup,
  selectWarmupStatus,
  useWarmup,
  WARMUP_SCREEN_DELAY_MS,
} from '@/lib/warmup';
import { ErrorState } from '../ErrorState/ErrorState';
import { OfflineState } from '../OfflineState/OfflineState';
import styles from './WarmupGate.module.css';

export type WarmupGateProps = {
  children: ReactNode;
};

function useDelayPassed(active: boolean, startedAt: number | null): boolean {
  const [passed, setPassed] = useState(false);

  useEffect(() => {
    if (!active || startedAt === null) {
      setPassed(false);
      return;
    }
    const remaining = startedAt + WARMUP_SCREEN_DELAY_MS - Date.now();
    if (remaining <= 0) {
      setPassed(true);
      return;
    }
    setPassed(false);
    const timer = setTimeout(() => setPassed(true), remaining);
    return () => clearTimeout(timer);
  }, [active, startedAt]);

  return passed;
}

export function WarmupGate({ children }: WarmupGateProps) {
  const t = useTranslations('SystemStates');
  const status = useWarmup(selectWarmupStatus);
  const startedAt = useWarmup((state) => state.startedAt);
  const delayPassed = useDelayPassed(status === 'warming', startedAt);

  let overlay: ReactNode = null;
  if (status === 'warming' && delayPassed) {
    overlay = (
      <div role="status" className={styles.waiting}>
        <EmptyState
          icon="info"
          title={t('warmupTitle')}
          text={t('warmupMessage')}
          action={
            <div className={styles.progress}>
              <Progress label={t('warmupProgress')} />
            </div>
          }
        />
      </div>
    );
  } else if (status === 'failed') {
    overlay = (
      <ErrorState
        onRetry={retryWarmup}
        title={t('warmupFailedTitle')}
        message={t('warmupFailedMessage')}
      />
    );
  } else if (status === 'offline') {
    overlay = <OfflineState onRetry={retryWarmup} />;
  }

  return (
    <div className={styles.root}>
      <div className={styles.content} inert={overlay !== null}>
        {children}
      </div>
      {overlay ? <div className={styles.overlay}>{overlay}</div> : null}
    </div>
  );
}
