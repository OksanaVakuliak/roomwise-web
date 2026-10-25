import { PricingDataSchema } from '@roomwise/calc-engine';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { captureException } from '@/lib/monitoring/client';
import { makePricingData } from '@/test/fixtures';
import {
  checkPricingData,
  resetPricingData,
  usePricingData,
} from './pricing-data';

vi.mock('@/lib/monitoring/client', () => ({ captureException: vi.fn() }));

const V1 = '1111111111111111';
const V2 = '2222222222222222';
const V3 = '3333333333333333';
const fetchMock = vi.fn();

function ok(data: unknown, etag?: string) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: etag ? { ETag: etag } : {},
  });
}

function notModified() {
  return new Response(null, { status: 304 });
}

function sentHeaders(call: number) {
  const init = fetchMock.mock.calls[call]?.[1] as RequestInit;
  return init.headers as Record<string, string> | undefined;
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.mocked(captureException).mockClear();
  vi.stubGlobal('fetch', fetchMock);
  resetPricingData();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('checkPricingData', () => {
  it('stores data, etag and version from a 200', async () => {
    const data = makePricingData();
    fetchMock.mockResolvedValue(ok(data, 'W/"a95fec826b163f12"'));

    await checkPricingData();

    expect(usePricingData.getState()).toMatchObject({
      status: 'ready',
      data,
      etag: 'W/"a95fec826b163f12"',
      version: data.version,
      priceUpdate: null,
    });
    expect(usePricingData.getState().checkedAt).not.toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/public/pricing-data',
      expect.objectContaining({ cache: 'no-store' }),
    );
    expect(sentHeaders(0)).toBeUndefined();
  });

  it('sends the weak etag back verbatim', async () => {
    fetchMock.mockResolvedValueOnce(
      ok(makePricingData(), 'W/"a95fec826b163f12"'),
    );
    await checkPricingData();
    fetchMock.mockResolvedValueOnce(notModified());

    await checkPricingData();

    expect(sentHeaders(1)).toEqual({
      'If-None-Match': 'W/"a95fec826b163f12"',
    });
  });

  it('only moves checkedAt on a 304', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      vi.setSystemTime(1_000);
      fetchMock.mockResolvedValueOnce(ok(makePricingData(), 'W/"a"'));
      await checkPricingData();
      const before = usePricingData.getState();
      const parse = vi.spyOn(PricingDataSchema, 'parse');
      vi.setSystemTime(5_000);
      fetchMock.mockResolvedValueOnce(notModified());

      await checkPricingData();

      const after = usePricingData.getState();
      expect(parse).not.toHaveBeenCalled();
      expect(after.checkedAt).toBe(5_000);
      expect(after.data).toBe(before.data);
      expect(after.etag).toBe(before.etag);
      expect(after.version).toBe(before.version);
      expect(after.priceUpdate).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('raises a price update when the version changes', async () => {
    fetchMock.mockResolvedValueOnce(
      ok(makePricingData({ version: V1 }), 'W/"1"'),
    );
    await checkPricingData();
    expect(usePricingData.getState().priceUpdate).toBeNull();
    fetchMock.mockResolvedValueOnce(
      ok(makePricingData({ version: V2 }), 'W/"2"'),
    );

    await checkPricingData();

    expect(usePricingData.getState().priceUpdate).toEqual({
      from: V1,
      to: V2,
    });
    usePricingData.getState().acknowledgePriceUpdate();
    expect(usePricingData.getState().priceUpdate).toBeNull();
  });

  it('keeps the first version of an unacknowledged price update', async () => {
    fetchMock.mockResolvedValueOnce(
      ok(makePricingData({ version: V1 }), 'W/"1"'),
    );
    await checkPricingData();
    fetchMock.mockResolvedValueOnce(
      ok(makePricingData({ version: V2 }), 'W/"2"'),
    );
    await checkPricingData();
    fetchMock.mockResolvedValueOnce(
      ok(makePricingData({ version: V3 }), 'W/"3"'),
    );

    await checkPricingData();

    expect(usePricingData.getState().priceUpdate).toEqual({
      from: V1,
      to: V3,
    });
  });

  it('does not raise a price update for an unchanged version', async () => {
    fetchMock.mockResolvedValueOnce(
      ok(makePricingData({ version: V1 }), 'W/"1"'),
    );
    await checkPricingData();
    fetchMock.mockResolvedValueOnce(
      ok(makePricingData({ version: V1 }), 'W/"1b"'),
    );

    await checkPricingData();

    expect(usePricingData.getState().priceUpdate).toBeNull();
  });

  it('shares one request between concurrent checks', async () => {
    fetchMock.mockResolvedValue(ok(makePricingData(), 'W/"1"'));

    const first = checkPricingData();
    expect(usePricingData.getState().status).toBe('loading');
    await Promise.all([first, checkPricingData()]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['a network error', () => Promise.reject(new TypeError('offline')), false],
    [
      'a server error',
      () => Promise.resolve(new Response('x', { status: 500 })),
      true,
    ],
    ['an invalid body', () => Promise.resolve(ok({ version: 1 })), true],
    [
      'a TypeError while reading the body',
      () =>
        Promise.resolve({
          status: 200,
          ok: true,
          headers: new Headers(),
          json: () => Promise.reject(new TypeError('broken body')),
        } as unknown as Response),
      true,
    ],
  ])('keeps previous data after %s', async (_name, failure, reported) => {
    const data = makePricingData();
    fetchMock.mockResolvedValueOnce(ok(data, 'W/"1"'));
    await checkPricingData();
    fetchMock.mockImplementationOnce(failure);

    await checkPricingData();

    expect(usePricingData.getState()).toMatchObject({
      status: 'error',
      data,
      etag: 'W/"1"',
    });
    expect(captureException).toHaveBeenCalledTimes(reported ? 1 : 0);
  });

  it('is in error without data when the first request fails, and can retry', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('offline'));
    await checkPricingData();
    expect(usePricingData.getState()).toMatchObject({
      status: 'error',
      data: null,
    });

    fetchMock.mockResolvedValueOnce(ok(makePricingData(), 'W/"1"'));
    await checkPricingData();

    expect(usePricingData.getState().status).toBe('ready');
  });

  it('ignores a response that arrives after a reset', async () => {
    let finish: (value: Response) => void = () => {};
    fetchMock.mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        finish = resolve;
      }),
    );
    const stale = checkPricingData();

    resetPricingData();
    finish(ok(makePricingData(), 'W/"1"'));
    await stale;

    expect(usePricingData.getState()).toMatchObject({
      status: 'idle',
      data: null,
    });
  });
});
