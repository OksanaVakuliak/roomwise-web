import { useQuery } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import { selectWarmupStatus, useWarmup } from '@/lib/warmup';
import { api } from './client';
import { ApiRequestError } from './request-error';

type Lang = 'en' | 'uk';

type Result<T> = { data?: T; error?: unknown; response: { status: number } };

export const catalogKeys = {
  styles: (lang: string) => ['styles', lang] as const,
  roomTypes: (lang: string) => ['room-types', lang] as const,
  engineering: (lang: string) => ['engineering', lang] as const,
  products: (categoryId: string, lang: string) =>
    ['products', categoryId, lang] as const,
  product: (productId: string, lang: string) =>
    ['product', productId, lang] as const,
  defaultMaterials: (styleId: string) =>
    ['default-materials', styleId] as const,
};

async function unwrap<T>(request: Promise<Result<T>>): Promise<T> {
  const { data, error, response } = await request;
  if (data === undefined) {
    throw new ApiRequestError(response.status, error);
  }
  return data;
}

function useCatalogReady() {
  return useWarmup(selectWarmupStatus) === 'ready';
}

function useLang(): Lang {
  return useLocale() as Lang;
}

export function useStyles() {
  const lang = useLang();
  const ready = useCatalogReady();
  return useQuery({
    queryKey: catalogKeys.styles(lang),
    queryFn: () =>
      unwrap(api.GET('/api/v1/public/styles', { params: { query: { lang } } })),
    enabled: ready,
  });
}

export function useRoomTypes() {
  const lang = useLang();
  const ready = useCatalogReady();
  return useQuery({
    queryKey: catalogKeys.roomTypes(lang),
    queryFn: () =>
      unwrap(
        api.GET('/api/v1/public/room-types', { params: { query: { lang } } }),
      ),
    enabled: ready,
  });
}

export function useEngineering() {
  const lang = useLang();
  const ready = useCatalogReady();
  return useQuery({
    queryKey: catalogKeys.engineering(lang),
    queryFn: () =>
      unwrap(
        api.GET('/api/v1/public/engineering', { params: { query: { lang } } }),
      ),
    enabled: ready,
  });
}

export function useCategoryProducts(categoryId: string | null) {
  const lang = useLang();
  const ready = useCatalogReady();
  return useQuery({
    queryKey: catalogKeys.products(categoryId ?? '', lang),
    queryFn: () =>
      unwrap(
        api.GET('/api/v1/public/categories/{categoryId}/products', {
          params: { path: { categoryId: categoryId ?? '' }, query: { lang } },
        }),
      ),
    enabled: ready && categoryId !== null,
  });
}

export function useProduct(productId: string | null) {
  const lang = useLang();
  const ready = useCatalogReady();
  return useQuery({
    queryKey: catalogKeys.product(productId ?? '', lang),
    queryFn: () =>
      unwrap(
        api.GET('/api/v1/public/products/{productId}', {
          params: { path: { productId: productId ?? '' }, query: { lang } },
        }),
      ),
    enabled: ready && productId !== null,
  });
}

export function useDefaultMaterials(styleId: string | null) {
  const ready = useCatalogReady();
  return useQuery({
    queryKey: catalogKeys.defaultMaterials(styleId ?? ''),
    queryFn: () =>
      unwrap(
        api.GET('/api/v1/public/styles/{styleId}/default-materials', {
          params: { path: { styleId: styleId ?? '' } },
        }),
      ),
    enabled: ready && styleId !== null,
  });
}
