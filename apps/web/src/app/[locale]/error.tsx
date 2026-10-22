'use client';

import * as Sentry from '@sentry/nextjs';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { StatusPage } from '@/components/layout';
import { Button, ButtonLink } from '@/components/ui';

export default function LocaleError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const t = useTranslations('Error');

  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <StatusPage title={t('title')} message={t('message')}>
      <Button kind="fill" onClick={retry}>
        {t('retry')}
      </Button>
      <ButtonLink href="/" kind="outline">
        {t('home')}
      </ButtonLink>
    </StatusPage>
  );
}
