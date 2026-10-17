import type { Locale } from 'next-intl';
import { type Currency, type ExchangeRate, money } from '@/lib/format';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden';
import styles from './Price.module.css';

export type PriceProps = {
  cents: number;
  currency: Currency;
  locale: Locale;
  rate?: ExchangeRate;
  oldCents?: number;
  oldLabel?: string;
  currentLabel?: string;
};

export function Price({
  cents,
  currency,
  locale,
  rate,
  oldCents,
  oldLabel,
  currentLabel,
}: PriceProps) {
  const current = money(cents, currency, locale, rate);

  if (oldCents === undefined) {
    return <span className={`${styles.root} num`}>{current}</span>;
  }

  return (
    <span className={`${styles.root} num`}>
      {oldLabel ? <VisuallyHidden>{oldLabel}</VisuallyHidden> : null}
      <s className={styles.old}>{money(oldCents, currency, locale, rate)}</s>{' '}
      {currentLabel ? <VisuallyHidden>{currentLabel}</VisuallyHidden> : null}
      <span className={styles.current}>{current}</span>
    </span>
  );
}
