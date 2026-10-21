'use client';

import { useLocale, useTranslations } from 'next-intl';
import { rateDate, rateValue } from '@/lib/format';
import { useExchangeRate } from '@/stores/exchange-rate';

export function ExchangeRateNote() {
  const t = useTranslations('ExchangeRate');
  const locale = useLocale();
  const loaded = useExchangeRate((state) => state.rate);

  if (!loaded) {
    return null;
  }

  return t(loaded.source === 'NBU' ? 'noteNbu' : 'noteManual', {
    rate: rateValue(loaded.uahPerUsd, locale),
    date: rateDate(loaded.date, locale),
  });
}
