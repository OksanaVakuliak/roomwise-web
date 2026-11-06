import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';

export type CalculationPageProps = {
  params: Promise<{ locale: string; publicId: string; number?: string }>;
};

export async function calculationMetadata({
  params,
}: CalculationPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'CalculationPage' });

  return {
    title: t('title'),
    robots: { index: false, follow: false },
  };
}
