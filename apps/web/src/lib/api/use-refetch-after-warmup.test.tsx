import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetWarmup, useWarmup } from '@/lib/warmup';
import { checkPricingData, usePricingData } from '@/stores/pricing-data';
import { createTestQueryClient } from '@/test/render-with-providers';
import { useRefetchAfterWarmup } from './use-refetch-after-warmup';

vi.mock('@/stores/pricing-data', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/stores/pricing-data')>();
  return { ...actual, checkPricingData: vi.fn() };
});

type PricingState = ReturnType<typeof usePricingData.getState>;

function setPricingStatus(status: PricingState['status']) {
  usePricingData.setState({ status });
}

function setup() {
  const queryClient = createTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  renderHook(() => useRefetchAfterWarmup(), { wrapper });
  return queryClient;
}

beforeEach(() => {
  resetWarmup();
  vi.mocked(checkPricingData).mockReset();
  setPricingStatus('ready');
});

describe('useRefetchAfterWarmup', () => {
  it('refetches only errored queries when warm-up becomes ready', async () => {
    const queryClient = setup();
    const failing = vi
      .fn()
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValue('ok');
    const fine = vi.fn().mockResolvedValue('ok');
    await queryClient
      .fetchQuery({ queryKey: ['failing'], queryFn: failing, retry: false })
      .catch(() => undefined);
    await queryClient.fetchQuery({ queryKey: ['fine'], queryFn: fine });
    act(() => useWarmup.setState({ server: 'warming' }));

    act(() => useWarmup.setState({ server: 'ready' }));

    await waitFor(() => expect(failing).toHaveBeenCalledTimes(2));
    expect(fine).toHaveBeenCalledTimes(1);
  });

  it('rechecks pricing data when it is in error', () => {
    setup();
    setPricingStatus('error');

    act(() => useWarmup.setState({ server: 'ready' }));

    expect(checkPricingData).toHaveBeenCalledTimes(1);
  });

  it('does nothing when pricing data is fine', () => {
    setup();

    act(() => useWarmup.setState({ server: 'ready' }));

    expect(checkPricingData).not.toHaveBeenCalled();
  });

  it('ignores updates that keep the server ready', () => {
    setup();
    act(() => useWarmup.setState({ server: 'ready' }));
    setPricingStatus('error');

    act(() => useWarmup.setState({ startedAt: 5 }));

    expect(checkPricingData).not.toHaveBeenCalled();
  });
});
