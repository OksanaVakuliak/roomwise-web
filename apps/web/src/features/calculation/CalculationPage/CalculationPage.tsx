'use client';

import { useLocale, useTranslations } from 'next-intl';
import { type ReactNode, useId } from 'react';
import { KeyValueGrid, VisuallyHidden } from '@/components/ui';
import { EstimateBreakdown } from '@/features/estimate';
import type { VersionView } from '@/lib/api/calculations';
import { displayMoney, localDate, rateDate, rateValue } from '@/lib/format';
import { usePreferences } from '@/stores/preferences';
import { snapshotCurrency } from '../snapshot-currency';
import { toSnapshotModel } from '../snapshot-model';
import styles from './CalculationPage.module.css';

const EMPTY_VALUE = '—';

export type CalculationPageProps = {
  version: VersionView;
  notices?: ReactNode;
  badge?: ReactNode;
  versions?: ReactNode;
  actions?: ReactNode;
};

export function CalculationPage({
  version,
  notices,
  badge,
  versions,
  actions,
}: CalculationPageProps) {
  const t = useTranslations('CalculationPage');
  const tRate = useTranslations('ExchangeRate');
  const locale = useLocale();
  const totalId = useId();
  const preferred = usePreferences((state) => state.currency);
  const { exchangeRate } = version;
  const { currency, rate } = snapshotCurrency(preferred, exchangeRate);
  const model = toSnapshotModel(version);
  const rateText = exchangeRate
    ? tRate(exchangeRate.source === 'NBU' ? 'noteNbu' : 'noteManual', {
        rate: rateValue(Number(exchangeRate.rate), locale),
        date: rateDate(exchangeRate.date, locale),
      })
    : null;

  const items = [
    {
      key: 'style',
      label: t('style'),
      value: version.style?.name ?? EMPTY_VALUE,
    },
    {
      key: 'saved',
      label: t('saved'),
      value: localDate(version.createdAt, locale),
    },
    {
      key: 'validUntil',
      label: t('validUntil'),
      value: localDate(version.expiresAt, locale),
    },
    ...(rateText ? [{ key: 'rate', label: t('rate'), value: rateText }] : []),
  ];

  return (
    <div className={styles.root}>
      {notices ? <div className={styles.notices}>{notices}</div> : null}
      <p className={styles.preliminary}>{t('preliminary')}</p>
      <section className={styles.total} aria-labelledby={totalId}>
        <div className={styles.bar}>
          <h2 id={totalId} className={styles.totalValue}>
            <VisuallyHidden>{t('totalLabel')}: </VisuallyHidden>
            {displayMoney(
              version.totals.usdCents,
              version.totals.uahKopecks,
              currency,
              locale,
            )}
          </h2>
          {badge ? <div className={styles.badge}>{badge}</div> : null}
        </div>
        {preferred === 'UAH' && !exchangeRate ? (
          <p className={styles.note}>{t('noRate')}</p>
        ) : null}
        <div className={styles.details}>
          <KeyValueGrid items={items} />
        </div>
      </section>
      <EstimateBreakdown
        model={model}
        currency={currency}
        locale={locale}
        rate={rate}
        partial={version.configuration.scope === 'PARTIAL'}
        readOnly
      />
      {versions}
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
  );
}
