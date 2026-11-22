import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { use } from 'react';
import { CONFIGURATOR_PATH } from '@/config/routes';
import { localeAlternates } from '@/i18n/metadata';
import { routing } from '@/i18n/routing';
import { StepRedirect } from './StepRedirect';

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const t = await getTranslations({
    locale,
    namespace: 'ConfiguratorSteps.title',
  });

  return {
    title: t('index'),
    alternates: localeAlternates(locale, CONFIGURATOR_PATH),
  };
}

export default function ConfiguratorPage({ params }: PageProps) {
  const { locale } = use(params);

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return <StepRedirect />;
}
