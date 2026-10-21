'use client';

import { useEffect } from 'react';
import { loadExchangeRate, useExchangeRate } from './exchange-rate';
import { usePreferences } from './preferences';

export function useExchangeRateSync(hydrated: boolean): void {
  const currency = usePreferences((state) => state.currency);

  useEffect(() => {
    if (!hydrated || currency !== 'UAH') {
      return;
    }
    if (useExchangeRate.getState().status === 'ready') {
      return;
    }
    loadExchangeRate().then(() => {
      const unavailable = useExchangeRate.getState().status === 'unavailable';
      const { currency: current, setCurrency } = usePreferences.getState();
      if (unavailable && current === 'UAH') {
        setCurrency('USD');
        useExchangeRate.setState({ notice: true });
      }
    });
  }, [hydrated, currency]);
}
