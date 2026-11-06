import { act, fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api/client';
import { clearCardCostCache } from '@/lib/engine/card-cost';
import { clearEstimateCache } from '@/lib/engine/run-estimate';
import { installMemoryStorage } from '@/lib/theme/test-utils';
import { resetWarmup, useWarmup } from '@/lib/warmup/warmup';
import { useDraft } from '@/stores/draft';
import { productIds } from '@/test/fixtures/catalog';
import { makeInteriorDraft } from '@/test/fixtures/draft';
import { renderWithProviders } from '@/test/render-with-providers';
import en from '../../../../../messages/en.json';
import { useRoomPricing } from '../../shell/use-room-pricing';
import { ProductDetail } from './ProductDetail';

vi.mock('@/lib/api/client', () => ({ api: { GET: vi.fn() } }));

function Harness() {
  const room = useDraft((state) => state.rooms[0]);
  const pricing = useRoomPricing();
  return (
    <ProductDetail
      productId={productIds.tile}
      categoryId="cat-floor"
      room={room}
      pricing={pricing}
      onChoose={vi.fn()}
      onClose={vi.fn()}
    />
  );
}

describe('ProductDetail', () => {
  beforeEach(() => {
    installMemoryStorage();
    clearEstimateCache();
    clearCardCostCache();
    resetWarmup();
    vi.mocked(api.GET).mockReset();
    useWarmup.setState({ server: 'ready' });
    useDraft.setState({ ...makeInteriorDraft(), revision: 1 });
  });

  it('shows a loading state, then offers a retry on a server error', async () => {
    vi.mocked(api.GET).mockResolvedValue({
      data: undefined,
      error: { error: { code: 'INTERNAL' } },
      response: { status: 500 },
    } as never);
    await act(async () => {
      renderWithProviders(<Harness />, { catalog: false });
    });

    const retry = await screen.findByRole('button', {
      name: en.SystemStates.retry,
    });
    expect(
      screen.queryByRole('button', { name: en.ProductDetail.choose }),
    ).not.toBeInTheDocument();
    const calls = vi.mocked(api.GET).mock.calls.length;

    await act(async () => {
      fireEvent.click(retry);
    });

    expect(vi.mocked(api.GET).mock.calls.length).toBeGreaterThan(calls);
  });
});
