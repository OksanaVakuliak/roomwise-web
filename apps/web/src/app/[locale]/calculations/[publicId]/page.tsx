import { notFound } from 'next/navigation';
import { hasLocale, useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { use } from 'react';
import { PageTitle } from '@/components/ui';
import { CalculationScreen } from '@/features/calculation';
import { routing } from '@/i18n/routing';
import {
  type CalculationPageProps,
  calculationMetadata,
} from '../calculation-metadata';

export const generateMetadata = calculationMetadata;

export default function CalculationRoute({ params }: CalculationPageProps) {
  const { locale, publicId } = use(params);

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = useTranslations('CalculationPage');

  return (
    <>
      <PageTitle>{t('heading')}</PageTitle>
      <CalculationScreen publicId={publicId} />
    </>
  );
}
