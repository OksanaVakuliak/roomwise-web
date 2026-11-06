import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { STEP_PATHS } from '@/config/routes';
import { localeAlternates } from '@/i18n/metadata';
import { routing } from '@/i18n/routing';
import type { StepId } from '@/lib/draft/schema';

export type StepPageProps = { params: Promise<{ locale: string }> };

export function stepMetadata(step: StepId) {
  return async ({ params }: StepPageProps): Promise<Metadata> => {
    const { locale } = await params;

    if (!hasLocale(routing.locales, locale)) {
      notFound();
    }

    const t = await getTranslations({
      locale,
      namespace: 'ConfiguratorSteps.title',
    });

    return {
      title: t(step),
      alternates: localeAlternates(locale, STEP_PATHS[step]),
    };
  };
}
