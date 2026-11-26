import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api/client';
import { createWriteGate } from '@/lib/api/write';
import { resetWarmup, useWarmup } from '@/lib/warmup';
import { adminErrors } from '@/test/fixtures/admin/errors';
import { adminIds } from '@/test/fixtures/admin/ids';
import {
  makeAdminProduct,
  makeAdminProducts,
} from '@/test/fixtures/admin/products';
import { createTestQueryClient } from '@/test/render-with-providers';
import { adminKeys } from './keys';
import {
  type CreateProductBody,
  changeProductStatus,
  createProduct,
  deleteProduct,
  fetchProducts,
  updateProduct,
  useChangeProductStatus,
  useProduct,
  useProducts,
} from './products';

vi.mock('@/lib/api/client', () => ({
  api: {
    GET: vi.fn(),
    POST: vi.fn(),
    PATCH: vi.fn(),
    DELETE: vi.fn(),
  },
}));

const mocked = (fn: unknown) => fn as ReturnType<typeof vi.fn>;
const get = mocked(api.GET);
const post = mocked(api.POST);
const patch = mocked(api.PATCH);
const del = mocked(api.DELETE);

function setup() {
  const queryClient = createTestQueryClient();
  function wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  return { queryClient, wrapper };
}

beforeEach(() => {
  vi.clearAllMocks();
  resetWarmup();
  useWarmup.setState({ server: 'ready' });
});

describe('product list', () => {
  it('sends q, categoryId, status and paging and drops empty values', async () => {
    get.mockResolvedValue({
      data: makeAdminProducts(),
      response: { status: 200 },
    });

    await fetchProducts({
      q: 'oak',
      categoryId: adminIds.categories.flooring,
      status: 'PUBLISHED',
      page: 2,
      pageSize: 50,
    });
    expect(get).toHaveBeenLastCalledWith('/api/v1/admin/products', {
      params: {
        query: {
          q: 'oak',
          categoryId: adminIds.categories.flooring,
          status: 'PUBLISHED',
          page: 2,
          pageSize: 50,
        },
      },
    });

    await fetchProducts({ q: '', page: 1, status: undefined });
    expect(get).toHaveBeenLastCalledWith('/api/v1/admin/products', {
      params: { query: { page: 1 } },
    });
  });

  it('keys the list by its params', async () => {
    get.mockResolvedValue({
      data: makeAdminProducts(),
      response: { status: 200 },
    });
    const { queryClient, wrapper } = setup();

    const { result } = renderHook(() => useProducts({ q: 'oak' }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.data?.total).toBe(5));

    expect(
      queryClient.getQueryData(
        adminKeys.area('catalog', 'products', 'list', { q: 'oak' }),
      ),
    ).toBeDefined();
  });

  it('loads one product', async () => {
    const product = makeAdminProduct();
    get.mockResolvedValue({ data: product, response: { status: 200 } });
    const { wrapper } = setup();

    const { result } = renderHook(() => useProduct(product.id), { wrapper });
    await waitFor(() => expect(result.current.data).toEqual(product));

    expect(get).toHaveBeenCalledWith('/api/v1/admin/products/{id}', {
      params: { path: { id: product.id } },
    });
  });

  it('does not fetch without an id', () => {
    const { wrapper } = setup();

    renderHook(() => useProduct(undefined), { wrapper });

    expect(get).not.toHaveBeenCalled();
  });
});

describe('product writes', () => {
  it('creates a product', async () => {
    const product = makeAdminProduct();
    post.mockResolvedValue({ data: product, response: { status: 201 } });
    const body: CreateProductBody = {
      categoryId: product.categoryId,
      materialTypeId: product.materialTypeId,
      name: product.name,
      description: product.description,
      brand: product.brand,
      manufacturer: product.manufacturer,
      color: product.color,
      size: product.size,
      priceCents: product.priceCents,
      confirmZeroPrice: false,
      unit: product.unit,
      heatedFloorCompatible: product.heatedFloorCompatible,
      images: [{ imageId: adminIds.images.laminate, isPrimary: true }],
      attributes: product.attributes,
    };

    await expect(createProduct(createWriteGate(), body)).resolves.toEqual(
      product,
    );
    expect(post).toHaveBeenCalledWith('/api/v1/admin/products', { body });
  });

  it('updates with the revision', async () => {
    const product = makeAdminProduct();
    patch.mockResolvedValue({ data: product, response: { status: 200 } });
    const body = {
      priceCents: 3000,
      confirmZeroPrice: false,
      revision: product.revision,
    };

    await updateProduct(createWriteGate(), product.id, body);

    expect(patch).toHaveBeenCalledWith('/api/v1/admin/products/{id}', {
      params: { path: { id: product.id } },
      body,
    });
  });

  it('deletes and surfaces a product in use', async () => {
    del.mockResolvedValueOnce({ response: { status: 204 } });
    await expect(
      deleteProduct(createWriteGate(), 'p'),
    ).resolves.toBeUndefined();

    const { status, body } = adminErrors.productInUse();
    del.mockResolvedValueOnce({ error: body, response: { status } });
    await expect(deleteProduct(createWriteGate(), 'p')).rejects.toMatchObject({
      status: 409,
      apiError: { code: 'PRODUCT_IN_USE' },
    });
  });

  it('returns warnings from a status change', async () => {
    const warnings = [
      {
        code: 'USED_AS_DEFAULT_MATERIAL' as const,
        params: {
          styles: [
            {
              id: adminIds.styles.modern,
              name: { en: 'Modern', uk: 'Сучасний' },
            },
          ],
        },
      },
    ];
    const product = makeAdminProduct({ status: 'ARCHIVED' });
    post.mockResolvedValue({
      data: { ...product, warnings },
      response: { status: 200 },
    });
    const body = { status: 'ARCHIVED' as const, revision: product.revision };

    const result = await changeProductStatus(
      createWriteGate(),
      product.id,
      body,
    );

    expect(result.warnings).toEqual(warnings);
    expect(post).toHaveBeenCalledWith('/api/v1/admin/products/{id}/status', {
      params: { path: { id: product.id } },
      body,
    });
  });

  it('refetches products and invalidates categories after a status change', async () => {
    const product = makeAdminProduct();
    get.mockResolvedValue({
      data: makeAdminProducts(),
      response: { status: 200 },
    });
    post.mockResolvedValue({ data: product, response: { status: 200 } });
    const { queryClient, wrapper } = setup();
    queryClient.setQueryData(adminKeys.area('catalog', 'categories'), []);

    const { result } = renderHook(
      () => ({ list: useProducts({}), write: useChangeProductStatus() }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.list.data).toBeDefined());

    await act(async () => {
      await result.current.write.mutateAsync({
        id: product.id,
        body: { status: 'DRAFT', revision: product.revision },
      });
    });

    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
    expect(
      queryClient.getQueryState(adminKeys.area('catalog', 'categories'))
        ?.isInvalidated,
    ).toBe(true);
  });
});
