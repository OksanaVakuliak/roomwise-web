import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api/client';
import { resetExchangeRate, useExchangeRate } from './exchange-rate';
import { usePreferences } from './preferences';
import { useDisplayCurrency } from './use-display-currency';
import { useExchangeRateSync } from './use-exchange-rate-sync';

vi.mock('@/lib/api/client', () => ({ api: { GET: vi.fn() } }));

const get = vi.mocked(api.GET) as unknown as ReturnType<typeof vi.fn>;

const READY = {
  data: {
    exchangeRate: { rate: '41.5', date: '2026-10-01', source: 'NBU' },
  },
};

beforeEach(() => {
  get.mockReset();
  resetExchangeRate();
  usePreferences.setState({ currency: 'USD' });
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
    get.mockResolvedValue(READY);
    usePreferences.setState({ currency: 'UAH' });

    renderHook(() => useExchangeRateSync(true));

    await waitFor(() =>
      expect(useExchangeRate.getState().status).toBe('ready'),
    );
    expect(usePreferences.getState().currency).toBe('UAH');
    expect(useExchangeRate.getState().notice).toBe(false);
  });

  it('reverts to USD with a notice when the rate is unavailable', async () => {
    get.mockResolvedValue({ data: { exchangeRate: null } });
    usePreferences.setState({ currency: 'UAH' });

    renderHook(() => useExchangeRateSync(true));

    await waitFor(() => expect(usePreferences.getState().currency).toBe('USD'));
    expect(useExchangeRate.getState().notice).toBe(true);
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('retries after unavailable when UAH is chosen again', async () => {
    get.mockResolvedValueOnce({ data: { exchangeRate: null } });
    usePreferences.setState({ currency: 'UAH' });
    renderHook(() => useExchangeRateSync(true));
    await waitFor(() => expect(usePreferences.getState().currency).toBe('USD'));

    get.mockResolvedValueOnce(READY);
    usePreferences.setState({ currency: 'UAH' });

    await waitFor(() =>
      expect(useExchangeRate.getState().status).toBe('ready'),
    );
    expect(usePreferences.getState().currency).toBe('UAH');
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
