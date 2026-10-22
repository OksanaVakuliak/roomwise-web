'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { Banner, Button } from '@/components/ui';
import styles from './UpdateNotice.module.css';

function reload() {
  window.location.reload();
}

export function UpdateNotice() {
  const t = useTranslations('UpdateNotice');
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    const container = navigator.serviceWorker;
    if (!container?.controller) {
      return;
    }
    const show = () => setAvailable(true);
    container.addEventListener('controllerchange', show);
    return () => container.removeEventListener('controllerchange', show);
  }, []);

  const dismiss = useCallback(() => setAvailable(false), []);

  if (!available) {
    return null;
  }

  return (
    <div className={styles.root}>
      <Banner
        action={
          <Button kind="fill" onClick={reload}>
            {t('reload')}
          </Button>
        }
        onDismiss={dismiss}
        dismissLabel={t('dismiss')}
      >
        {t('newVersion')}
      </Banner>
    </div>
  );
}
