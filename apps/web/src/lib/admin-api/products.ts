import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { components } from '@/generated/api';
import { unwrap, useCatalogReady } from '@/lib/api/catalog';
import { api } from '@/lib/api/client';
import { createWriteGate, type WriteGate } from '@/lib/api/write';
import { acknowledged } from './acknowledged';
import { adminKeys } from './keys';

type Schemas = components['schemas'];

export type AdminProduct = Schemas['ProductAdminDto_Output'];
export type AdminProductsPage = Schemas['ProductAdminListResponseDto_Output'];
export type AdminProductRow = AdminProductsPage['items'][number];
export type CreateProductBody = Schemas['CreateProductDto'];
export type UpdateProductBody = Schemas['PatchProductDto'];
export type ProductStatusBody = Schemas['UpdateProductStatusDto'];
export type ProductStatusResult = Schemas['ProductStatusResponseDto_Output'];
export type ProductStatus = ProductStatusBody['status'];
export type ProductWarning = NonNullable<
  ProductStatusResult['warnings']
>[number];

export type ProductListParams = {
  q?: string;
  categoryId?: string;
  status?: ProductStatus;
  page?: number;
  pageSize?: number;
};

const definedParams = (params: ProductListParams): ProductListParams =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== '',
    ),
  );

export function fetchProducts(
  params: ProductListParams = {},
): Promise<AdminProductsPage> {
  return unwrap(
    api.GET('/api/v1/admin/products', {
      params: { query: definedParams(params) },
    }),
  );
}

export function fetchProduct(id: string): Promise<AdminProduct> {
  return unwrap(
    api.GET('/api/v1/admin/products/{id}', { params: { path: { id } } }),
  );
}

export function createProduct(
  gate: WriteGate,
  body: CreateProductBody,
): Promise<AdminProduct> {
  return gate.write(
    () => api.POST('/api/v1/admin/products', { body }),
    crypto.randomUUID(),
  );
}

export function updateProduct(
  gate: WriteGate,
  id: string,
  body: UpdateProductBody,
): Promise<AdminProduct> {
  return gate.write(
    () =>
      api.PATCH('/api/v1/admin/products/{id}', {
        params: { path: { id } },
        body,
      }),
    crypto.randomUUID(),
  );
}

export async function deleteProduct(
  gate: WriteGate,
  id: string,
): Promise<void> {
  await gate.write(
    async () =>
      acknowledged(
        await api.DELETE('/api/v1/admin/products/{id}', {
          params: { path: { id } },
        }),
      ),
    crypto.randomUUID(),
  );
}

export function changeProductStatus(
  gate: WriteGate,
  id: string,
  body: ProductStatusBody,
): Promise<ProductStatusResult> {
  return gate.write(
    () =>
      api.POST('/api/v1/admin/products/{id}/status', {
        params: { path: { id } },
        body,
      }),
    crypto.randomUUID(),
  );
}

export function useProducts(params: ProductListParams = {}) {
  const ready = useCatalogReady();
  return useQuery({
    queryKey: adminKeys.area('catalog', 'products', 'list', params),
    queryFn: () => fetchProducts(params),
    enabled: ready,
    placeholderData: (previous) => previous,
  });
}

export function useProduct(id: string | undefined) {
  const ready = useCatalogReady();
  return useQuery({
    queryKey: adminKeys.area('catalog', 'products', 'item', id),
    queryFn: () => fetchProduct(id as string),
    enabled: ready && id !== undefined,
  });
}

function useProductMutation<Variables, Result>(
  write: (gate: WriteGate, variables: Variables) => Promise<Result>,
) {
  const queryClient = useQueryClient();
  const [gate] = useState(createWriteGate);
  return useMutation({
    mutationFn: (variables: Variables) => write(gate, variables),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: adminKeys.area('catalog', 'products'),
        }),
        queryClient.invalidateQueries({
          queryKey: adminKeys.area('catalog', 'categories'),
        }),
      ]);
    },
  });
}

export function useCreateProduct() {
  return useProductMutation((gate, body: CreateProductBody) =>
    createProduct(gate, body),
  );
}

export function useUpdateProduct() {
  return useProductMutation(
    (gate, { id, body }: { id: string; body: UpdateProductBody }) =>
      updateProduct(gate, id, body),
  );
}

export function useDeleteProduct() {
  return useProductMutation((gate, id: string) => deleteProduct(gate, id));
}

export function useChangeProductStatus() {
  return useProductMutation(
    (gate, { id, body }: { id: string; body: ProductStatusBody }) =>
      changeProductStatus(gate, id, body),
  );
}
