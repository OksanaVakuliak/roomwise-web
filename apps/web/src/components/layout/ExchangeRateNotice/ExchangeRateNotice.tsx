'use client';

import { useTranslations } from 'next-intl';
import { Toast } from '@/components/ui';
import { useExchangeRate } from '@/stores/exchange-rate';
import styles from './ExchangeRateNotice.module.css';

export function ExchangeRateNotice() {
  const t = useTranslations('ExchangeRate');
  const visible = useExchangeRate((state) => state.notice);
  const dismiss = useExchangeRate((state) => state.dismissNotice);

  if (!visible) {
    return null;
  }

  return (
    <div className={styles.root}>
      <Toast dismissLabel={t('dismiss')} onDismiss={dismiss}>
        {t('unavailable')}
      </Toast>
    </div>
  );
}
