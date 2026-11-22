import { useQuery } from '@tanstack/react-query';
import { unwrap, useCatalogReady } from '@/lib/api/catalog';
import { api } from '@/lib/api/client';
import { adminKeys } from './keys';

export const NEW_LEADS_REFETCH_MS = 60_000;

export async function fetchNewLeadsCount(): Promise<number> {
  const page = await unwrap(
    api.GET('/api/v1/admin/leads', {
      params: { query: { status: 'NEW', pageSize: 1 } },
    }),
  );
  return page.total;
}

export function useNewLeadsCount() {
  const ready = useCatalogReady();
  return useQuery({
    queryKey: adminKeys.area('leads', 'new-count'),
    queryFn: fetchNewLeadsCount,
    enabled: ready,
    refetchInterval: NEW_LEADS_REFETCH_MS,
  });
}
