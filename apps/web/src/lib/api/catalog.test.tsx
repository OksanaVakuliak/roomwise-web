import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { shouldRetry } from '@/lib/query';
import { resetWarmup, useWarmup } from '@/lib/warmup';
import {
  categoryIds,
  makeCategoryProducts,
  makeDefaultMaterials,
  makeEngineering,
  makeProductDetails,
  makeRoomTypes,
  makeStyles,
  productIds,
  styleIds,
} from '@/test/fixtures';
import { createTestQueryClient } from '@/test/render-with-providers';
import {
  catalogKeys,
  useCategoryProducts,
  useDefaultMaterials,
  useEngineering,
  useProduct,
  useRoomTypes,
  useStyles,
} from './catalog';
import { api } from './client';
import { ApiRequestError } from './request-error';

vi.mock('@/lib/api/client', () => ({ api: { GET: vi.fn() } }));

const get = vi.mocked(api.GET) as unknown as ReturnType<typeof vi.fn>;

function makeWrapper(
  queryClient: ReturnType<typeof createTestQueryClient>,
  locale: 'en' | 'uk',
) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <NextIntlClientProvider locale={locale} messages={{}}>
          {children}
        </NextIntlClientProvider>
      </QueryClientProvider>
    );
  };
}

function setup(locale: 'en' | 'uk' = 'en') {
  const queryClient = createTestQueryClient();
  return { queryClient, wrapper: makeWrapper(queryClient, locale) };
}

const markReady = () => act(() => useWarmup.setState({ server: 'ready' }));

describe('catalogKeys', () => {
  it('matches the keys used to seed the cache', () => {
    expect(catalogKeys.styles('en')).toEqual(['styles', 'en']);
    expect(catalogKeys.roomTypes('uk')).toEqual(['room-types', 'uk']);
    expect(catalogKeys.engineering('en')).toEqual(['engineering', 'en']);
    expect(catalogKeys.products('c1', 'en')).toEqual(['products', 'c1', 'en']);
    expect(catalogKeys.product('p1', 'uk')).toEqual(['product', 'p1', 'uk']);
    expect(catalogKeys.defaultMaterials('s1')).toEqual([
      'default-materials',
      's1',
    ]);
  });
});

describe('catalog hooks', () => {
  beforeEach(() => {
    get.mockReset();
    resetWarmup();
  });

  it('does not fire until the warm-up is ready', async () => {
    get.mockResolvedValue({ data: makeStyles() });
    const { wrapper } = setup();

    const { result } = renderHook(() => useStyles(), { wrapper });

    expect(get).not.toHaveBeenCalled();
    expect(result.current.fetchStatus).toBe('idle');

    await markReady();

    await waitFor(() => expect(result.current.data).toEqual(makeStyles()));
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('does not fire while an id is missing', async () => {
    const { wrapper } = setup();
    await markReady();

    renderHook(
      () => {
        useCategoryProducts(null);
        useProduct(null);
        useDefaultMaterials(null);
      },
      { wrapper },
    );

    expect(get).not.toHaveBeenCalled();
  });

  it('requests every endpoint with the active language', async () => {
    const responses: Record<string, unknown> = {
      '/api/v1/public/styles': makeStyles(),
      '/api/v1/public/room-types': makeRoomTypes(),
      '/api/v1/public/engineering': makeEngineering(),
      '/api/v1/public/categories/{categoryId}/products': makeCategoryProducts(
        categoryIds.floor,
      ),
      '/api/v1/public/products/{productId}': makeProductDetails(
        productIds.laminate,
      ),
      '/api/v1/public/styles/{styleId}/default-materials': makeDefaultMaterials(
        styleIds.modern,
      ),
    };
    get.mockImplementation(async (path: string) => ({ data: responses[path] }));
    const { queryClient, wrapper } = setup('uk');
    await markReady();

    renderHook(
      () => {
        useStyles();
        useRoomTypes();
        useEngineering();
        useCategoryProducts(categoryIds.floor);
        useProduct(productIds.laminate);
        useDefaultMaterials(styleIds.modern);
      },
      { wrapper },
    );

    await waitFor(() => expect(get).toHaveBeenCalledTimes(6));
    const query = { query: { lang: 'uk' } };
    expect(get).toHaveBeenCalledWith('/api/v1/public/styles', {
      params: query,
    });
    expect(get).toHaveBeenCalledWith(
      '/api/v1/public/categories/{categoryId}/products',
      { params: { path: { categoryId: categoryIds.floor }, ...query } },
    );
    expect(get).toHaveBeenCalledWith(
      '/api/v1/public/styles/{styleId}/default-materials',
      { params: { path: { styleId: styleIds.modern } } },
    );
    await waitFor(() =>
      expect(
        queryClient.getQueryData(catalogKeys.defaultMaterials(styleIds.modern)),
      ).toBeDefined(),
    );
  });

  it('refetches for a new language and keeps the old cache entry', async () => {
    get.mockResolvedValue({ data: makeStyles() });
    const queryClient = createTestQueryClient();
    await markReady();

    const en = renderHook(() => useStyles(), {
      wrapper: makeWrapper(queryClient, 'en'),
    });
    await waitFor(() => expect(en.result.current.isSuccess).toBe(true));
    en.unmount();

    const uk = renderHook(() => useStyles(), {
      wrapper: makeWrapper(queryClient, 'uk'),
    });
    await waitFor(() => expect(uk.result.current.isSuccess).toBe(true));

    expect(get).toHaveBeenCalledTimes(2);
    expect(get).toHaveBeenLastCalledWith('/api/v1/public/styles', {
      params: { query: { lang: 'uk' } },
    });
    expect(queryClient.getQueryData(catalogKeys.styles('en'))).toEqual(
      makeStyles(),
    );
    expect(queryClient.getQueryData(catalogKeys.styles('uk'))).toEqual(
      makeStyles(),
    );
  });

  it('turns an error envelope into a typed error', async () => {
    const error = {
      error: {
        code: 'VALIDATION_FAILED',
        params: { limit: 3 },
        fields: [{ path: 'lang', code: 'INVALID' }],
      },
    };
    get.mockResolvedValue({ error, response: { status: 422 } });
    const { wrapper } = setup();
    await markReady();

    const { result } = renderHook(() => useStyles(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    const failure = result.current.error;
    expect(failure).toBeInstanceOf(ApiRequestError);
    expect(failure).toMatchObject({
      status: 422,
      apiError: {
        code: 'VALIDATION_FAILED',
        params: { limit: 3 },
        fields: [{ path: 'lang', code: 'INVALID' }],
      },
    });
    expect(shouldRetry(0, failure)).toBe(false);
  });

  it('surfaces a 404 on default materials without swallowing it', async () => {
    get.mockResolvedValue({
      error: { error: { code: 'NOT_FOUND' } },
      response: { status: 404 },
    });
    const { wrapper } = setup();
    await markReady();

    const { result } = renderHook(() => useDefaultMaterials(styleIds.modern), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({
      status: 404,
      apiError: { code: 'NOT_FOUND' },
    });
  });

  it('treats a 5xx as retryable and a non-JSON body as unknown', async () => {
    get.mockResolvedValue({ error: 'Bad Gateway', response: { status: 502 } });
    const { wrapper } = setup();
    await markReady();

    const { result } = renderHook(() => useStyles(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({
      status: 502,
      apiError: { code: 'unknown' },
    });
    expect(shouldRetry(0, result.current.error)).toBe(true);
  });
});
