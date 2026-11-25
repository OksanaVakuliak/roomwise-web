import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api/client';
import { resetWarmup, useWarmup } from '@/lib/warmup';
import { makeAdminLeads } from '@/test/fixtures/admin/leads';
import { createTestQueryClient } from '@/test/render-with-providers';
import { adminKeys } from './keys';
import {
  fetchNewLeadsCount,
  NEW_LEADS_REFETCH_MS,
  useNewLeadsCount,
} from './leads';

vi.mock('@/lib/api/client', () => ({
  api: { GET: vi.fn() },
}));

const get = vi.mocked(api.GET) as unknown as ReturnType<typeof vi.fn>;

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

describe('fetchNewLeadsCount', () => {
  it('requests one NEW lead and returns the total', async () => {
    get.mockResolvedValue({
      data: { ...makeAdminLeads(), total: 7 },
      response: { status: 200 },
    });

    await expect(fetchNewLeadsCount()).resolves.toBe(7);
    expect(get).toHaveBeenCalledWith('/api/v1/admin/leads', {
      params: { query: { status: 'NEW', pageSize: 1 } },
    });
  });
});

describe('useNewLeadsCount', () => {
  it('exposes the total under the leads key and polls every minute', async () => {
    get.mockResolvedValue({
      data: { ...makeAdminLeads(), total: 3 },
      response: { status: 200 },
    });
    const { queryClient, wrapper } = setup();

    const { result } = renderHook(() => useNewLeadsCount(), { wrapper });
    await waitFor(() => expect(result.current.data).toBe(3));

    const query = queryClient
      .getQueryCache()
      .find({ queryKey: adminKeys.area('leads', 'new-count') });
    expect(query).toBeDefined();
    expect(NEW_LEADS_REFETCH_MS).toBe(60_000);
    expect(query?.observers[0]?.options.refetchInterval).toBe(60_000);
  });

  it('waits for the server to warm up', () => {
    useWarmup.setState({ server: 'warming' });
    const { wrapper } = setup();

    renderHook(() => useNewLeadsCount(), { wrapper });

    expect(get).not.toHaveBeenCalled();
  });
});
