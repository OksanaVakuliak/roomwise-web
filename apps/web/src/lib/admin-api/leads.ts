import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useUserActive } from '@/lib/activity';
import { unwrap, useCatalogReady } from '@/lib/api/catalog';
import { api } from '@/lib/api/client';
import { adminKeys } from './keys';

export const NEW_LEADS_REFETCH_MS = 60_000;
export const NEW_LEADS_IDLE_MS = 10 * 60_000;

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
  const active = useUserActive(NEW_LEADS_IDLE_MS);
  const query = useQuery({
    queryKey: adminKeys.area('leads', 'new-count'),
    queryFn: fetchNewLeadsCount,
    enabled: ready,
    refetchInterval: active ? NEW_LEADS_REFETCH_MS : false,
  });
  const { refetch, dataUpdatedAt } = query;

  useEffect(() => {
    if (
      active &&
      dataUpdatedAt > 0 &&
      Date.now() - dataUpdatedAt >= NEW_LEADS_REFETCH_MS
    ) {
      void refetch();
    }
  }, [active, dataUpdatedAt, refetch]);

  return query;
}
