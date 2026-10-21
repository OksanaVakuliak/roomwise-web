import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale, useTranslations } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { use } from 'react';
import { StepLayout, ZoneStub } from '@/components/layout';
import {
  PageTitle,
  TapeRule,
  TapeStep,
  type TapeStepState,
} from '@/components/ui';
import { CONFIGURATOR_PATH } from '@/config/routes';
import { localeAlternates } from '@/i18n/metadata';
import { routing } from '@/i18n/routing';
import { ConfiguratorEstimate } from './ConfiguratorEstimate';

const STEPS = [1, 2, 3, 4, 5] as const;
const CURRENT_STEP = 1;

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'Configurator' });

  return {
    title: t('pageTitle'),
    alternates: localeAlternates(locale, CONFIGURATOR_PATH),
  };
}

function stepState(step: number): TapeStepState {
  if (step < CURRENT_STEP) return 'done';
  return step === CURRENT_STEP ? 'now' : 'later';
}

export default function ConfiguratorPage({ params }: PageProps) {
  const { locale } = use(params);

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = useTranslations('Configurator');

  return (
    <StepLayout
      steps={
        <nav aria-label={t('tapeLabel')}>
          <TapeRule size="mobile">
            {STEPS.map((step) => (
              <TapeStep
                key={step}
                size="mobile"
                number={`A${step}`}
                label={step === CURRENT_STEP ? t(`steps.${step}`) : undefined}
                state={stepState(step)}
                stateLabel={t(`state.${stepState(step)}`)}
              />
            ))}
          </TapeRule>
        </nav>
      }
      content={
        <>
          <PageTitle>{t('steps.1')}</PageTitle>
          <ZoneStub kind="content" />
        </>
      }
      scene={<ZoneStub kind="scene" />}
      showcase={<ZoneStub kind="showcase" />}
      cost={<ConfiguratorEstimate />}
    />
  );
}
