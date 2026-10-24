import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makePricingData } from '@/test/fixtures';
import {
  loadExchangeRate,
  resetExchangeRate,
  useExchangeRate,
} from './exchange-rate';
import { checkPricingData, resetPricingData } from './pricing-data';

const fetchMock = vi.fn();

function respond(exchangeRate: unknown) {
  fetchMock.mockImplementation(
    async () =>
      new Response(JSON.stringify({ ...makePricingData(), exchangeRate }), {
        status: 200,
        headers: { ETag: 'W/"1"' },
      }),
  );
}

describe('loadExchangeRate', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    resetPricingData();
    resetExchangeRate();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads the server rate and caches it', async () => {
    respond({ rate: '41.5000', date: '2026-10-01', source: 'NBU' });

    await loadExchangeRate();
    await loadExchangeRate();

    expect(useExchangeRate.getState()).toMatchObject({
      status: 'ready',
      rate: { uahPerUsd: 41.5, date: '2026-10-01', source: 'NBU' },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('shares one pricing-data request with the pricing store', async () => {
    respond({ rate: '41.5000', date: '2026-10-01', source: 'MANUAL' });

    const loading = loadExchangeRate();
    expect(useExchangeRate.getState().status).toBe('loading');
    await Promise.all([loading, checkPricingData(), loadExchangeRate()]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(useExchangeRate.getState().status).toBe('ready');
  });

  it('makes no request when pricing data is already loaded', async () => {
    respond({ rate: '41.5000', date: '2026-10-01', source: 'NBU' });
    await checkPricingData();

    await loadExchangeRate();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(useExchangeRate.getState().status).toBe('ready');
  });

  it('follows a later pricing-data refresh', async () => {
    respond({ rate: '41.5000', date: '2026-10-01', source: 'NBU' });
    await loadExchangeRate();

    respond({ rate: '42.0000', date: '2026-10-02', source: 'MANUAL' });
    await checkPricingData();

    expect(useExchangeRate.getState().rate).toEqual({
      uahPerUsd: 42,
      date: '2026-10-02',
      source: 'MANUAL',
    });
  });

  it.each([
    ['a null rate', null],
    ['a non-numeric rate', { rate: 'abc', date: '2026-10-01', source: 'NBU' }],
    ['a zero rate', { rate: '0.0000', date: '2026-10-01', source: 'NBU' }],
    ['a missing date', { rate: '41.5000', source: 'NBU' }],
    ['an unparsable date', { rate: '41.5000', date: 'soon', source: 'NBU' }],
  ])('is unavailable for %s', async (_name, exchangeRate) => {
    respond(exchangeRate);

    await loadExchangeRate();

    expect(useExchangeRate.getState()).toMatchObject({
      status: 'unavailable',
      rate: null,
    });
  });

  it('is unavailable for a failed response', async () => {
    fetchMock.mockResolvedValue(new Response('boom', { status: 500 }));

    await loadExchangeRate();

    expect(useExchangeRate.getState()).toMatchObject({
      status: 'unavailable',
      rate: null,
    });
  });

  it('is unavailable after a network error and can retry', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('offline'));
    await loadExchangeRate();
    expect(useExchangeRate.getState().status).toBe('unavailable');

    respond({ rate: '40.0000', date: '2026-10-02', source: 'NBU' });
    await loadExchangeRate();

    expect(useExchangeRate.getState().status).toBe('ready');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('clears the notice once the rate loads', async () => {
    useExchangeRate.setState({ notice: true });
    respond({ rate: '41.5000', date: '2026-10-01', source: 'NBU' });

    await loadExchangeRate();

    expect(useExchangeRate.getState().notice).toBe(false);
  });

  it('ignores a load that finishes after a reset', async () => {
    let finish: (value: Response) => void = () => {};
    fetchMock.mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        finish = resolve;
      }),
    );
    const stale = loadExchangeRate();

    resetPricingData();
    resetExchangeRate();
    finish(
      new Response(
        JSON.stringify({
          ...makePricingData(),
          exchangeRate: { rate: '41.5000', date: '2026-10-01', source: 'NBU' },
        }),
        { status: 200 },
      ),
    );
    await stale;

    expect(useExchangeRate.getState()).toMatchObject({
      status: 'idle',
      rate: null,
    });
    respond({ rate: '40.0000', date: '2026-10-02', source: 'NBU' });
    await loadExchangeRate();
    expect(useExchangeRate.getState().rate?.uahPerUsd).toBe(40);
  });

  it('clears the notice on dismiss', () => {
    useExchangeRate.setState({ notice: true });
    useExchangeRate.getState().dismissNotice();
    expect(useExchangeRate.getState().notice).toBe(false);
  });
});
