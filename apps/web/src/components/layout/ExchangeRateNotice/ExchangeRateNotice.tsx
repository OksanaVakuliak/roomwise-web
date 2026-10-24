'use client';

import { useTranslations } from 'next-intl';
import { Toast } from '@/components/ui';
import { useExchangeRate } from '@/stores/exchange-rate';

export function ExchangeRateNotice() {
  const t = useTranslations('ExchangeRate');
  const visible = useExchangeRate((state) => state.notice);
  const dismiss = useExchangeRate((state) => state.dismissNotice);

  if (!visible) {
    return null;
  }

  return (
    <Toast dismissLabel={t('dismiss')} onDismiss={dismiss}>
      {t('unavailable')}
    </Toast>
  );
}
