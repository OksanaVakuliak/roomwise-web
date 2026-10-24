'use client';

import type { Currency, ExchangeRate } from '@/lib/format';
import { useExchangeRate } from './exchange-rate';
import { usePreferences } from './preferences';

export type DisplayCurrency = {
  currency: Currency;
  rate?: ExchangeRate;
};

export function useDisplayCurrency(): DisplayCurrency {
  const preferred = usePreferences((state) => state.currency);
  const rate = useExchangeRate((state) => state.rate);

  if (preferred === 'UAH' && rate) {
    return { currency: 'UAH', rate };
  }
  return { currency: 'USD' };
}
