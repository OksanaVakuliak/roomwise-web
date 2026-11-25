import { notFound } from 'next/navigation';
import { hasLocale, useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { use } from 'react';
import { PageTitle } from '@/components/ui';
import { routing } from '@/i18n/routing';
import type { StepId } from '@/lib/draft/schema';
import type { StepPageProps } from './step-metadata';

export function StepPage({ step, params }: StepPageProps & { step: StepId }) {
  const { locale } = use(params);

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = useTranslations('ConfiguratorSteps.heading');

  return <PageTitle>{t(step)}</PageTitle>;
}
