import { useTranslations } from 'next-intl';
import { StatusPage } from '@/components/layout';
import { ButtonLink } from '@/components/ui';

export default function AdminNotFound() {
  const t = useTranslations('NotFound');

  return (
    <main>
      <StatusPage title={t('title')} message={t('message')}>
        <ButtonLink href="/admin">{t('home')}</ButtonLink>
      </StatusPage>
    </main>
  );
}
