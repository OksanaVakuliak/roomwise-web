'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Button, ButtonLink, EstimateStamp } from '@/components/ui';
import { type ExchangeRate, money } from '@/lib/format';
import { usePreferences } from '@/stores/preferences';
import { usePreferencesHydration } from '@/stores/use-preferences-hydration';

const RATE: ExchangeRate = { uahPerUsd: 41.5 };
const PARTS = [
  { key: 'base', cents: 684400 },
  { key: 'materials', cents: 491240 },
  { key: 'engineering', cents: 126000 },
  { key: 'options', cents: 34000 },
] as const;

export function ConfiguratorEstimate() {
  const t = useTranslations('Configurator');
  const locale = useLocale();

  usePreferencesHydration();

  const currency = usePreferences((state) => state.currency);
  const format = (cents: number) => money(cents, currency, locale, RATE);
  const sum = PARTS.reduce((total, part) => total + part.cents, 0);
  const total = format(sum);

  return (
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
  );
}
