'use client';

import { useLocale, useTranslations } from 'next-intl';
import { rateDate, rateValue } from '@/lib/format';
import { useExchangeRate } from '@/stores/exchange-rate';
import { useDisplayCurrency } from '@/stores/use-display-currency';

export function ExchangeRateNote() {
  const t = useTranslations('ExchangeRate');
  const locale = useLocale();
  const { currency } = useDisplayCurrency();
  const loaded = useExchangeRate((state) => state.rate);

  if (currency !== 'UAH' || !loaded) {
    return null;
  }

  return t(loaded.source === 'NBU' ? 'noteNbu' : 'noteManual', {
    rate: rateValue(loaded.uahPerUsd, locale),
    date: rateDate(loaded.date, locale),
  });
}
