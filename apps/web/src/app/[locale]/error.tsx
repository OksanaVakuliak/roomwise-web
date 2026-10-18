'use client';

import { useTranslations } from 'next-intl';
import { StatusPage } from '@/components/layout';
import { Button, ButtonLink } from '@/components/ui';

export default function LocaleError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const t = useTranslations('Error');

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
