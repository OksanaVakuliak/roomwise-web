'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { Banner, Button } from '@/components/ui';
import { isNewVersion } from '@/lib/pwa';

function reload() {
  window.location.reload();
}

export function UpdateNotice() {
  const t = useTranslations('UpdateNotice');
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    const container = navigator.serviceWorker;
    if (!container) {
      return;
    }
    const check = () => {
      if (
        isNewVersion(
          container.controller?.scriptURL,
          process.env.NEXT_PUBLIC_APP_VERSION,
        )
      ) {
        setAvailable(true);
      }
    };
    container.addEventListener('controllerchange', check);
    return () => container.removeEventListener('controllerchange', check);
  }, []);

  const dismiss = useCallback(() => setAvailable(false), []);

  if (!available) {
    return null;
  }

  return (
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
  );
}
