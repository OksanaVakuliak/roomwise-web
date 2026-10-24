import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makePricingData } from '@/test/fixtures';
import { resetExchangeRate, useExchangeRate } from './exchange-rate';
import { usePreferences } from './preferences';
import { resetPricingData } from './pricing-data';
import { useDisplayCurrency } from './use-display-currency';
import { chooseCurrency, useExchangeRateSync } from './use-exchange-rate-sync';

const get = vi.fn();

function pricing(exchangeRate: unknown) {
  return new Response(JSON.stringify({ ...makePricingData(), exchangeRate }), {
    status: 200,
  });
}

const READY = pricing({ rate: '41.5000', date: '2026-10-01', source: 'NBU' });
const NO_RATE = pricing(null);

beforeEach(() => {
  get.mockReset();
  vi.stubGlobal('fetch', get);
  resetPricingData();
  resetExchangeRate();
  usePreferences.setState({ currency: 'USD' });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useExchangeRateSync', () => {
  it('does not load the rate while the currency is USD', () => {
    renderHook(() => useExchangeRateSync(true));

    expect(get).not.toHaveBeenCalled();
  });

  it('does not load the rate before hydration', () => {
    usePreferences.setState({ currency: 'UAH' });

    renderHook(() => useExchangeRateSync(false));

    expect(get).not.toHaveBeenCalled();
  });

  it('loads the rate for UAH and keeps the currency', async () => {
    get.mockImplementation(async () => READY.clone());
    usePreferences.setState({ currency: 'UAH' });

    renderHook(() => useExchangeRateSync(true));

    await waitFor(() =>
      expect(useExchangeRate.getState().status).toBe('ready'),
    );
    expect(usePreferences.getState().currency).toBe('UAH');
    expect(useExchangeRate.getState().notice).toBe(false);
  });

  it('keeps a saved UAH and shows the notice when the rate is unavailable', async () => {
    get.mockImplementation(async () => NO_RATE.clone());
    usePreferences.setState({ currency: 'UAH' });

    renderHook(() => useExchangeRateSync(true));

    await waitFor(() => expect(useExchangeRate.getState().notice).toBe(true));
    expect(usePreferences.getState().currency).toBe('UAH');
    expect(get).toHaveBeenCalledTimes(1);
    const { result } = renderHook(() => useDisplayCurrency());
    expect(result.current).toEqual({ currency: 'USD' });
  });
});

describe('chooseCurrency', () => {
  it('switches to UAH once the rate is ready', async () => {
    get.mockImplementation(async () => READY.clone());

    await chooseCurrency('UAH');

    expect(usePreferences.getState().currency).toBe('UAH');
    expect(useExchangeRate.getState().notice).toBe(false);
  });

  it('reverts to USD with a notice when the rate is unavailable', async () => {
    get.mockImplementation(async () => NO_RATE.clone());

    await chooseCurrency('UAH');

    expect(usePreferences.getState().currency).toBe('USD');
    expect(useExchangeRate.getState().notice).toBe(true);
  });

  it('retries after a failure even though the saved currency is UAH', async () => {
    get.mockImplementationOnce(async () => NO_RATE.clone());
    usePreferences.setState({ currency: 'UAH' });
    renderHook(() => useExchangeRateSync(true));
    await waitFor(() => expect(useExchangeRate.getState().notice).toBe(true));

    get.mockImplementationOnce(async () => READY.clone());
    await chooseCurrency('UAH');

    expect(get).toHaveBeenCalledTimes(2);
    expect(useExchangeRate.getState().status).toBe('ready');
    expect(useExchangeRate.getState().notice).toBe(false);
    expect(usePreferences.getState().currency).toBe('UAH');
  });

  it('does not load the rate for USD', async () => {
    await chooseCurrency('USD');

    expect(get).not.toHaveBeenCalled();
  });
});

describe('useDisplayCurrency', () => {
  it('is USD without a rate even when UAH is chosen', () => {
    usePreferences.setState({ currency: 'UAH' });
    const { result } = renderHook(() => useDisplayCurrency());
    expect(result.current).toEqual({ currency: 'USD' });
  });

  it('is UAH with the rate once it is ready', () => {
    usePreferences.setState({ currency: 'UAH' });
    useExchangeRate.setState({
      status: 'ready',
      rate: { uahPerUsd: 41.5, date: '2026-10-01', source: 'NBU' },
    });
    const { result } = renderHook(() => useDisplayCurrency());
    expect(result.current.currency).toBe('UAH');
    expect(result.current.rate?.uahPerUsd).toBe(41.5);
  });

  it('is USD when USD is chosen although the rate is ready', () => {
    useExchangeRate.setState({
      status: 'ready',
      rate: { uahPerUsd: 41.5, date: '2026-10-01', source: 'NBU' },
    });
    const { result } = renderHook(() => useDisplayCurrency());
    expect(result.current.currency).toBe('USD');
  });
});
