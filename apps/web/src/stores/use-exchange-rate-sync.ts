'use client';

import { useEffect } from 'react';
import type { Currency } from '@/lib/format';
import { loadExchangeRate, useExchangeRate } from './exchange-rate';
import { usePreferences } from './preferences';

async function ensureRate(): Promise<boolean> {
  await loadExchangeRate();
  const available = useExchangeRate.getState().status === 'ready';
  if (!available) {
    useExchangeRate.setState({ notice: true });
  }
  return available;
}

export async function chooseCurrency(currency: Currency): Promise<void> {
  const { setCurrency } = usePreferences.getState();
  setCurrency(currency);
  if (currency === 'UAH' && !(await ensureRate())) {
    if (usePreferences.getState().currency === 'UAH') {
      setCurrency('USD');
    }
  }
}

export function useExchangeRateSync(hydrated: boolean): void {
  useEffect(() => {
    if (hydrated && usePreferences.getState().currency === 'UAH') {
      void ensureRate();
    }
  }, [hydrated]);
}
