'use client';

import { useLocale, useTranslations } from 'next-intl';
import { ExchangeRateNote } from '@/components/layout';
import { Button, ButtonLink, EstimateStamp } from '@/components/ui';
import { money } from '@/lib/format';
import { useDisplayCurrency } from '@/stores/use-display-currency';
import { usePreferencesHydration } from '@/stores/use-preferences-hydration';

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

  const { currency, rate } = useDisplayCurrency();
  const format = (cents: number) => money(cents, currency, locale, rate);
  const sum = PARTS.reduce((total, part) => total + part.cents, 0);
  const total = format(sum);
  const shares = PARTS.map((part) => (part.cents / sum) * 100);
  const barLabel = t('barLabel', {
    base: Math.round(shares[0]),
    materials: Math.round(shares[1]),
    engineering: Math.round(shares[2]),
    options: Math.round(shares[3]),
  });

  return (
    <EstimateStamp
      totalLabel={t('totalLabel')}
      total={total}
      note={currency === 'UAH' ? <ExchangeRateNote /> : undefined}
      barLabel={barLabel}
      toggleLabel={t('toggleLabel')}
      announcement={t('announcement', { total })}
      parts={PARTS.map((part, index) => ({
        key: part.key,
        label: t(part.key),
        value: format(part.cents),
        share: shares[index],
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
