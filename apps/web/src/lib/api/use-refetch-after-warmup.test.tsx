import {
  type QueryClient,
  QueryClientProvider,
  QueryObserver,
} from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetWarmup, useWarmup } from '@/lib/warmup';
import { createTestQueryClient } from '@/test/render-with-providers';
import { useRefetchAfterWarmup } from './use-refetch-after-warmup';

function setup() {
  const queryClient = createTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  renderHook(() => useRefetchAfterWarmup(), { wrapper });
  return queryClient;
}

function observe(
  queryClient: QueryClient,
  key: string,
  queryFn: () => unknown,
) {
  const observer = new QueryObserver(queryClient, {
    queryKey: [key],
    queryFn,
    retry: false,
  });
  observer.subscribe(() => undefined);
  return observer;
}

beforeEach(() => {
  resetWarmup();
});

describe('useRefetchAfterWarmup', () => {
  it('refetches only active errored queries when warm-up becomes ready', async () => {
    const queryClient = setup();
    const failing = vi
      .fn()
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValue('ok');
    const fine = vi.fn().mockResolvedValue('ok');
    const unobserved = vi.fn().mockRejectedValue(new Error('down'));
    observe(queryClient, 'failing', failing);
    observe(queryClient, 'fine', fine);
    await queryClient
      .fetchQuery({
        queryKey: ['unobserved'],
        queryFn: unobserved,
        retry: false,
      })
      .catch(() => undefined);
    await waitFor(() =>
      expect(queryClient.getQueryState(['failing'])?.status).toBe('error'),
    );
    act(() => useWarmup.setState({ server: 'warming' }));

    act(() => useWarmup.setState({ server: 'ready' }));

    await waitFor(() => expect(failing).toHaveBeenCalledTimes(2));
    expect(fine).toHaveBeenCalledTimes(1);
    expect(unobserved).toHaveBeenCalledTimes(1);
  });
});
