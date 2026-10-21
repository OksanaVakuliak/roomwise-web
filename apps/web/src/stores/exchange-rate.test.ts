import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api/client';
import {
  loadExchangeRate,
  resetExchangeRate,
  useExchangeRate,
} from './exchange-rate';

vi.mock('@/lib/api/client', () => ({ api: { GET: vi.fn() } }));

const get = vi.mocked(api.GET) as unknown as ReturnType<typeof vi.fn>;

function respond(exchangeRate: unknown) {
  get.mockResolvedValue({ data: { exchangeRate } });
}

describe('loadExchangeRate', () => {
  beforeEach(() => {
    get.mockReset();
    resetExchangeRate();
  });

  it('parses the server rate and caches it', async () => {
    respond({ rate: '41.5000', date: '2026-10-01', source: 'NBU' });

    await loadExchangeRate();
    await loadExchangeRate();

    expect(useExchangeRate.getState()).toMatchObject({
      status: 'ready',
      rate: { uahPerUsd: 41.5, date: '2026-10-01', source: 'NBU' },
    });
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('shares one request between concurrent callers', async () => {
    respond({ rate: '41.5', date: '2026-10-01', source: 'MANUAL' });

    const loading = loadExchangeRate();
    expect(useExchangeRate.getState().status).toBe('loading');
    await Promise.all([loading, loadExchangeRate()]);

    expect(get).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['a null rate', { data: { exchangeRate: null } }],
    ['a failed response', { error: { message: 'boom' } }],
    [
      'a non-numeric rate',
      { data: { exchangeRate: { rate: 'abc', date: 'x', source: 'NBU' } } },
    ],
    [
      'a zero rate',
      { data: { exchangeRate: { rate: '0', date: 'x', source: 'NBU' } } },
    ],
    [
      'a negative rate',
      { data: { exchangeRate: { rate: '-3', date: 'x', source: 'NBU' } } },
    ],
  ])('is unavailable for %s', async (_name, response) => {
    get.mockResolvedValue(response);

    await loadExchangeRate();

    expect(useExchangeRate.getState()).toMatchObject({
      status: 'unavailable',
      rate: null,
    });
  });

  it('is unavailable after a network error and can retry', async () => {
    get.mockRejectedValueOnce(new TypeError('offline'));
    await loadExchangeRate();
    expect(useExchangeRate.getState().status).toBe('unavailable');

    respond({ rate: '40', date: '2026-10-02', source: 'NBU' });
    await loadExchangeRate();

    expect(useExchangeRate.getState().status).toBe('ready');
    expect(get).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['a missing date', { rate: '41.5', source: 'NBU' }],
    ['an unparsable date', { rate: '41.5', date: 'soon', source: 'NBU' }],
  ])('is unavailable for %s', async (_name, exchangeRate) => {
    respond(exchangeRate);

    await loadExchangeRate();

    expect(useExchangeRate.getState()).toMatchObject({
      status: 'unavailable',
      rate: null,
    });
  });

  it('clears the notice once the rate loads', async () => {
    useExchangeRate.setState({ notice: true });
    respond({ rate: '41.5', date: '2026-10-01', source: 'NBU' });

    await loadExchangeRate();

    expect(useExchangeRate.getState().notice).toBe(false);
  });

  it('ignores a load that finishes after a reset', async () => {
    let finish: (value: unknown) => void = () => {};
    get.mockReturnValueOnce(new Promise((resolve) => (finish = resolve)));
    const stale = loadExchangeRate();

    resetExchangeRate();
    finish({
      data: {
        exchangeRate: { rate: '41.5', date: '2026-10-01', source: 'NBU' },
      },
    });
    await stale;

    expect(useExchangeRate.getState()).toMatchObject({
      status: 'idle',
      rate: null,
    });
    respond({ rate: '40', date: '2026-10-02', source: 'NBU' });
    await loadExchangeRate();
    expect(useExchangeRate.getState().rate?.uahPerUsd).toBe(40);
  });

  it('clears the notice on dismiss', () => {
    useExchangeRate.setState({ notice: true });
    useExchangeRate.getState().dismissNotice();
    expect(useExchangeRate.getState().notice).toBe(false);
  });
});
