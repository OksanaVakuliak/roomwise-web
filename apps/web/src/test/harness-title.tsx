import { useTranslations } from 'next-intl';

export function HarnessTitle() {
  const t = useTranslations('Home');
  return <h1>{t('title')}</h1>;
}
