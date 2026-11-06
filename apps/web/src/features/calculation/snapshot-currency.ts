import type { VersionView } from '@/lib/api/calculations';
import type { Currency, ExchangeRate } from '@/lib/format';

export type SnapshotCurrency = {
  currency: Currency;
  rate?: ExchangeRate;
};

export function snapshotCurrency(
  preferred: Currency,
  exchangeRate: VersionView['exchangeRate'],
): SnapshotCurrency {
  const rate: ExchangeRate | undefined = exchangeRate
    ? { uahPerUsd: Number(exchangeRate.rate) }
    : undefined;
  return { currency: preferred === 'UAH' && rate ? 'UAH' : 'USD', rate };
}
