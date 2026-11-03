import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetWarmup, useWarmup } from '@/lib/warmup';
import {
  calculationIds,
  makeLatestVersionView,
  makeOldVersionView,
  makeSaveCalculationResponse,
  makeVersionView,
} from '@/test/fixtures';
import { createTestQueryClient } from '@/test/render-with-providers';
import {
  calculationKeys,
  recalculateCalculation,
  type SaveCalculationBody,
  saveCalculation,
  useCalculationVersion,
  useLatestCalculation,
} from './calculations';
import { api } from './client';
import { ApiRequestError } from './request-error';
import { createWriteGate, RateLimitedError } from './write';

vi.mock('@/lib/api/client', () => ({
  api: { GET: vi.fn(), POST: vi.fn() },
}));

const get = vi.mocked(api.GET) as unknown as ReturnType<typeof vi.fn>;
const post = vi.mocked(api.POST) as unknown as ReturnType<typeof vi.fn>;

const { publicId } = calculationIds;
const body = { configuration: {} } as unknown as SaveCalculationBody;

function setup(locale: 'en' | 'uk' = 'en') {
  const queryClient = createTestQueryClient();
  function wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <NextIntlClientProvider locale={locale} messages={{}}>
          {children}
        </NextIntlClientProvider>
      </QueryClientProvider>
    );
  }
  return { queryClient, wrapper };
}

const markReady = () => act(() => useWarmup.setState({ server: 'ready' }));

beforeEach(() => {
  vi.clearAllMocks();
  resetWarmup();
  useWarmup.setState({ server: 'ready' });
});

describe('calculationKeys', () => {
  it('shapes keys so latest can be invalidated by prefix', () => {
    expect(calculationKeys.latest(publicId, 'uk')).toEqual([
      'calculation',
      publicId,
      'latest',
      'uk',
    ]);
    expect(calculationKeys.version(publicId, 2, 'en')).toEqual([
      'calculation',
      publicId,
      2,
      'en',
    ]);
  });
});

describe('saveCalculation', () => {
  it('posts with lang, body and the idempotency key header', async () => {
    const saved = makeSaveCalculationResponse();
    post.mockResolvedValue({ data: saved, response: { status: 201 } });

    await expect(
      saveCalculation(createWriteGate(), {
        body,
        lang: 'uk',
        idempotencyKey: 'key-1',
      }),
    ).resolves.toEqual(saved);

    expect(post).toHaveBeenCalledExactlyOnceWith(
      '/api/v1/public/calculations',
      {
        params: {
          query: { lang: 'uk' },
          header: { 'Idempotency-Key': 'key-1' },
        },
        body,
      },
    );
  });

  it('reuses the same key when the gate retries after a network failure', async () => {
    post.mockRejectedValueOnce(new TypeError('offline')).mockResolvedValueOnce({
      data: makeSaveCalculationResponse(),
      response: { status: 201 },
    });

    await saveCalculation(createWriteGate(), {
      body,
      lang: 'en',
      idempotencyKey: 'key-1',
    });

    expect(post).toHaveBeenCalledTimes(2);
    for (const call of post.mock.calls) {
      expect(call[1].params.header).toEqual({ 'Idempotency-Key': 'key-1' });
    }
  });

  it('surfaces 429 as RateLimitedError', async () => {
    post.mockResolvedValue({
      error: {
        error: { code: 'RATE_LIMITED', params: { retryAfterSeconds: 12 } },
      },
      response: { status: 429 },
    });

    const failure = await saveCalculation(createWriteGate(), {
      body,
      lang: 'en',
      idempotencyKey: 'key-1',
    }).catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(RateLimitedError);
    expect(failure).toMatchObject({ retryAfterSeconds: 12 });
  });
});

describe('recalculateCalculation', () => {
  it('posts the base version with lang and idempotency key', async () => {
    const view = makeLatestVersionView();
    post.mockResolvedValue({ data: view, response: { status: 201 } });

    await expect(
      recalculateCalculation(createWriteGate(), publicId, {
        body: { basedOnVersion: 1 },
        lang: 'uk',
        idempotencyKey: 'key-2',
      }),
    ).resolves.toEqual(view);

    expect(post).toHaveBeenCalledExactlyOnceWith(
      '/api/v1/public/calculations/{publicId}/versions',
      {
        params: {
          path: { publicId },
          query: { lang: 'uk' },
          header: { 'Idempotency-Key': 'key-2' },
        },
        body: { basedOnVersion: 1 },
      },
    );
  });

  it('surfaces 404 as ApiRequestError with CALCULATION_NOT_FOUND', async () => {
    post.mockResolvedValue({
      error: { error: { code: 'CALCULATION_NOT_FOUND' } },
      response: { status: 404 },
    });

    const failure = await recalculateCalculation(createWriteGate(), publicId, {
      body: { basedOnVersion: 1 },
      lang: 'en',
      idempotencyKey: 'key-2',
    }).catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(ApiRequestError);
    expect(failure).toMatchObject({
      status: 404,
      apiError: { code: 'CALCULATION_NOT_FOUND' },
    });
  });
});

describe('calculation queries', () => {
  it('does not fire before warmup is ready or without a public id', async () => {
    useWarmup.setState({ server: 'warming' });
    const { wrapper } = setup();

    renderHook(
      () => {
        useLatestCalculation(publicId);
        useLatestCalculation(null);
        useCalculationVersion(null, 1);
      },
      { wrapper },
    );
    expect(get).not.toHaveBeenCalled();
    await markReady();

    await waitFor(() => expect(get).toHaveBeenCalledTimes(1));
    expect(get).toHaveBeenCalledWith('/api/v1/public/calculations/{publicId}', {
      params: { path: { publicId }, query: { lang: 'en' } },
    });
  });

  it('requests latest and a version with the active language and caches by key', async () => {
    get.mockImplementation(async (path: string) => ({
      data: path.endsWith('{number}')
        ? makeOldVersionView()
        : makeVersionView(),
    }));
    const { queryClient, wrapper } = setup('uk');

    renderHook(
      () => {
        useLatestCalculation(publicId);
        useCalculationVersion(publicId, 1);
      },
      { wrapper },
    );

    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
    expect(get).toHaveBeenCalledWith('/api/v1/public/calculations/{publicId}', {
      params: { path: { publicId }, query: { lang: 'uk' } },
    });
    expect(get).toHaveBeenCalledWith(
      '/api/v1/public/calculations/{publicId}/versions/{number}',
      { params: { path: { publicId, number: '1' }, query: { lang: 'uk' } } },
    );
    await waitFor(() => {
      expect(
        queryClient.getQueryData(calculationKeys.latest(publicId, 'uk')),
      ).toEqual(makeVersionView());
      expect(
        queryClient.getQueryData(calculationKeys.version(publicId, 1, 'uk')),
      ).toEqual(makeOldVersionView());
    });
  });

  it('invalidates latest by the prefix key', async () => {
    get.mockResolvedValue({ data: makeVersionView() });
    const { queryClient, wrapper } = setup();
    const { result } = renderHook(() => useLatestCalculation(publicId), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await act(() =>
      queryClient.invalidateQueries({
        queryKey: ['calculation', publicId, 'latest'],
      }),
    );

    expect(get).toHaveBeenCalledTimes(2);
  });

  it('surfaces 404 as ApiRequestError with CALCULATION_NOT_FOUND', async () => {
    get.mockResolvedValue({
      error: { error: { code: 'CALCULATION_NOT_FOUND' } },
      response: { status: 404 },
    });
    const { wrapper } = setup();

    const { result } = renderHook(() => useLatestCalculation(publicId), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(ApiRequestError);
    expect(result.current.error).toMatchObject({
      status: 404,
      apiError: { code: 'CALCULATION_NOT_FOUND' },
    });
  });
});
