import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makePricingData } from '@/test/fixtures';
import { createTestQueryClient } from '@/test/render-with-providers';
import {
  checkPricingData,
  resetPricingData,
  seedPricingData,
  usePricingData,
} from './pricing-data';
import {
  PRICING_DATA_RECHECK_MS,
  usePricingDataSync,
} from './use-pricing-data-sync';

const V1 = '1111111111111111';
const V2 = '2222222222222222';
const fetchMock = vi.fn();

function ok(version: string) {
  return new Response(JSON.stringify(makePricingData({ version })), {
    status: 200,
    headers: { ETag: `W/"${version}"` },
  });
}

function setup() {
  const queryClient = createTestQueryClient();
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { ...renderHook(() => usePricingDataSync(), { wrapper }), invalidate };
}

function show(state: 'visible' | 'hidden') {
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(state);
  document.dispatchEvent(new Event('visibilitychange'));
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  resetPricingData();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('usePricingDataSync', () => {
  it('checks on mount', async () => {
    fetchMock.mockResolvedValue(ok(V1));

    setup();

    await vi.waitFor(() =>
      expect(usePricingData.getState().status).toBe('ready'),
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rechecks on becoming visible only when the data is stale', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(1_000);
    seedPricingData(makePricingData(), 'W/"v1"');
    fetchMock.mockResolvedValue(new Response(null, { status: 304 }));
    setup();
    await checkPricingData();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.setSystemTime(1_000 + PRICING_DATA_RECHECK_MS - 1);
    show('visible');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.setSystemTime(1_000 + PRICING_DATA_RECHECK_MS + 5_000);
    show('hidden');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    show('visible');
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it('invalidates priced queries when the version changes', async () => {
    seedPricingData(makePricingData({ version: V1 }), 'W/"v1"');
    fetchMock.mockResolvedValue(ok(V2));
    const { invalidate } = setup();

    await vi.waitFor(() =>
      expect(usePricingData.getState().priceUpdate).not.toBeNull(),
    );

    expect(usePricingData.getState().priceUpdate).toEqual({
      from: V1,
      to: V2,
    });
    expect(invalidate.mock.calls.map(([filters]) => filters)).toEqual([
      { queryKey: ['products'] },
      { queryKey: ['product'] },
      { queryKey: ['engineering'] },
    ]);
  });

  it('does not invalidate on the first load', async () => {
    fetchMock.mockResolvedValue(ok(V1));
    const { invalidate } = setup();

    await vi.waitFor(() =>
      expect(usePricingData.getState().status).toBe('ready'),
    );

    expect(invalidate).not.toHaveBeenCalled();
  });

  it('stops listening after unmount', async () => {
    fetchMock.mockResolvedValue(ok(V1));
    const { unmount } = setup();
    await vi.waitFor(() =>
      expect(usePricingData.getState().status).toBe('ready'),
    );
    unmount();
    usePricingData.setState({ checkedAt: 0 });

    show('visible');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
