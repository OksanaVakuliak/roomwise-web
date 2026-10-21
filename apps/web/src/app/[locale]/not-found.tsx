import { useTranslations } from 'next-intl';
import { StatusPage } from '@/components/layout';
import { ButtonLink } from '@/components/ui';

export default function LocaleNotFound() {
  const t = useTranslations('NotFound');

  return (
    <StatusPage title={t('title')} message={t('message')}>
      <ButtonLink href="/">{t('home')}</ButtonLink>
    </StatusPage>
  );
}
