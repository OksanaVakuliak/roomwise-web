'use client';

import { useTranslations } from 'next-intl';
import { ButtonLink, EmptyState } from '@/components/ui';
import { CONFIGURATOR_PATH } from '@/config/routes';

export function CalculationNotFound() {
  const t = useTranslations('CalculationPage.notFound');

  return (
    <EmptyState
      icon="warning"
      headingLevel={2}
      title={t('title')}
      text={t('text')}
      action={<ButtonLink href={CONFIGURATOR_PATH}>{t('action')}</ButtonLink>}
    />
  );
}
