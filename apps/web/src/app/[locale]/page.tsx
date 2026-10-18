import { notFound } from 'next/navigation';
import { hasLocale, useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { use } from 'react';
import { ButtonLink } from '@/components/ui';
import { CONFIGURATOR_PATH } from '@/config/routes';
import { routing } from '@/i18n/routing';
import styles from './page.module.css';

const STEPS = [
  'object',
  'style',
  'interior',
  'engineering',
  'estimate',
] as const;

export default function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = useTranslations('Home');

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>{t('title')}</h1>
      <p className={styles.intro}>{t('intro')}</p>
      <ButtonLink href={CONFIGURATOR_PATH} kind="heat" className={styles.start}>
        {t('start')}
      </ButtonLink>
      <section>
        <h2 className={styles.stepsTitle}>{t('stepsTitle')}</h2>
        <ol className={styles.steps}>
          {STEPS.map((step) => (
            <li key={step} className={styles.step}>
              <span className={styles.code}>{t(`steps.${step}.code`)}</span>
              <span className={styles.name}>{t(`steps.${step}.name`)}</span>
              <span className={styles.text}>{t(`steps.${step}.text`)}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
