import { useQuery } from '@tanstack/react-query';
import type { components } from '@/generated/api';
import { type Lang, unwrap, useCatalogReady, useLang } from './catalog';
import { api } from './client';
import type { WriteGate } from './write';

type Schemas = components['schemas'];

export type SaveCalculationBody = Schemas['SaveCalculationRequestDto'];
export type SavedCalculation = Schemas['SaveCalculationResponseDto_Output'];
export type VersionView = Schemas['VersionViewDto_Output'];

export type WriteRequest<Body> = {
  body: Body;
  lang: Lang;
  idempotencyKey: string;
};

export const calculationKeys = {
  all: (publicId: string) => ['calculation', publicId] as const,
  latest: (publicId: string, lang: string) =>
    ['calculation', publicId, 'latest', lang] as const,
  version: (publicId: string, number: number, lang: string) =>
    ['calculation', publicId, number, lang] as const,
};

export function saveCalculation(
  gate: WriteGate,
  { body, lang, idempotencyKey }: WriteRequest<SaveCalculationBody>,
): Promise<SavedCalculation> {
  return gate.write(
    (key) =>
      api.POST('/api/v1/public/calculations', {
        params: { query: { lang }, header: { 'Idempotency-Key': key } },
        body,
      }),
    idempotencyKey,
  );
}

export function recalculateCalculation(
  gate: WriteGate,
  publicId: string,
  { body, lang, idempotencyKey }: WriteRequest<{ basedOnVersion: number }>,
): Promise<VersionView> {
  return gate.write(
    (key) =>
      api.POST('/api/v1/public/calculations/{publicId}/versions', {
        params: {
          path: { publicId },
          query: { lang },
          header: { 'Idempotency-Key': key },
        },
        body,
      }),
    idempotencyKey,
  );
}

export function useLatestCalculation(publicId: string | null) {
  const lang = useLang();
  const ready = useCatalogReady();
  return useQuery({
    queryKey: calculationKeys.latest(publicId ?? '', lang),
    queryFn: () =>
      unwrap(
        api.GET('/api/v1/public/calculations/{publicId}', {
          params: { path: { publicId: publicId as string }, query: { lang } },
        }),
      ),
    enabled: ready && publicId !== null,
  });
}

export function useCalculationVersion(publicId: string | null, number: number) {
  const lang = useLang();
  const ready = useCatalogReady();
  return useQuery({
    queryKey: calculationKeys.version(publicId ?? '', number, lang),
    queryFn: () =>
      unwrap(
        api.GET('/api/v1/public/calculations/{publicId}/versions/{number}', {
          params: {
            path: { publicId: publicId as string, number: String(number) },
            query: { lang },
          },
        }),
      ),
    enabled: ready && publicId !== null,
  });
}
