import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale, useLocale, useTranslations } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { use } from 'react';
import { StepLayout, ZoneStub } from '@/components/layout';
import {
  Button,
  ButtonLink,
  EstimateStamp,
  TapeRule,
  TapeStep,
  type TapeStepState,
} from '@/components/ui';
import { routing } from '@/i18n/routing';
import { type ExchangeRate, money } from '@/lib/format';
import styles from './page.module.css';

const STEPS = [1, 2, 3, 4, 5] as const;
const SIZES = ['mobile', 'desktop'] as const;
const CURRENT_STEP = 1;
const RATE: ExchangeRate = { uahPerUsd: 41.5 };
const PARTS = [
  { key: 'base', cents: 684400 },
  { key: 'materials', cents: 491240 },
  { key: 'engineering', cents: 126000 },
  { key: 'options', cents: 34000 },
] as const;

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'Configurator' });

  return { title: t('pageTitle') };
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
  const activeLocale = useLocale();
  const format = (cents: number) => money(cents, 'USD', activeLocale, RATE);
  const sum = PARTS.reduce((total, part) => total + part.cents, 0);
  const total = format(sum);

  return (
    <StepLayout
      steps={
        <nav aria-label={t('tapeLabel')}>
          {SIZES.map((size) => (
            <TapeRule key={size} size={size} className={styles[size]}>
              {STEPS.map((step) => (
                <TapeStep
                  key={step}
                  size={size}
                  number={`A${step}`}
                  label={
                    size === 'desktop' || step === CURRENT_STEP
                      ? t(`steps.${step}`)
                      : undefined
                  }
                  state={stepState(step)}
                  stateLabel={t(`state.${stepState(step)}`)}
                />
              ))}
            </TapeRule>
          ))}
        </nav>
      }
      content={
        <>
          <h1 className={styles.title}>{t('steps.1')}</h1>
          <ZoneStub kind="content" />
        </>
      }
      scene={<ZoneStub kind="scene" />}
      showcase={<ZoneStub kind="showcase" />}
      cost={
        <EstimateStamp
          totalLabel={t('totalLabel')}
          total={total}
          barLabel={t('barLabel')}
          toggleLabel={t('toggleLabel')}
          announcement={t('announcement', { total })}
          parts={PARTS.map((part) => ({
            key: part.key,
            label: t(part.key),
            value: format(part.cents),
            share: (part.cents / sum) * 100,
          }))}
          actions={
            <>
              <ButtonLink href="/" kind="outline">
                {t('back')}
              </ButtonLink>
              <Button kind="fill">{t('next')}</Button>
            </>
          }
        />
      }
    />
  );
}
