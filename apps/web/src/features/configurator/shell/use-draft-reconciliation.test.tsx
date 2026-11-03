import { act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api/client';
import { createDefaultDraft } from '@/lib/draft/schema';
import { installMemoryStorage } from '@/lib/theme/test-utils';
import { useWarmup } from '@/lib/warmup';
import { useDraft } from '@/stores/draft';
import { categoryIds, productIds, styleIds } from '@/test/fixtures/catalog';
import { makeDraftRoom, makeEmptyDraft } from '@/test/fixtures/draft';
import { makePricingData } from '@/test/fixtures/pricing-data';
import {
  createTestQueryClient,
  renderWithProviders,
  seedCatalog,
} from '@/test/render-with-providers';
import { useDraftReconciliation } from './use-draft-reconciliation';

vi.mock('@/lib/api/client', () => ({ api: { GET: vi.fn() } }));

const roomId = '00000000-0000-4000-8000-000000000301';

function Probe() {
  useDraftReconciliation(true);
  return null;
}

function unavailablePricing() {
  const base = makePricingData();
  return makePricingData({
    products: base.products.map((product) =>
      product.id === productIds.laminatePremium
        ? { ...product, available: false }
        : product,
    ),
  });
}

function seedDraft(styleId: string) {
  useDraft.setState({
    ...makeEmptyDraft({
      styleId,
      rooms: [
        makeDraftRoom({
          clientId: roomId,
          selections: {
            [categoryIds.floor]: {
              productId: productIds.laminatePremium,
              disabled: false,
              source: 'manual',
            },
          },
        }),
      ],
    }),
    replacements: [],
  });
}

async function renderFailingMaterials(styleId: string) {
  useWarmup.setState({ server: 'ready' });
  const queryClient = createTestQueryClient();
  seedCatalog(queryClient, 'en');
  queryClient.removeQueries({ queryKey: ['default-materials'] });
  renderWithProviders(<Probe />, {
    queryClient,
    catalog: false,
    pricing: unavailablePricing(),
  });
  await waitFor(() =>
    expect(
      queryClient.getQueryState(['default-materials', styleId])?.status,
    ).toBe('error'),
  );
  await act(async () => {});
}

describe('useDraftReconciliation', () => {
  beforeEach(() => {
    installMemoryStorage();
    useDraft.setState({ ...createDefaultDraft(), replacements: [] });
    vi.mocked(api.GET).mockReset();
    vi.mocked(api.GET).mockResolvedValue({
      data: undefined,
      error: {},
      response: { status: 503 },
    } as never);
  });

  it('waits when the default materials failed but the style still exists', async () => {
    seedDraft(styleIds.modern);

    await renderFailingMaterials(styleIds.modern);

    expect(useDraft.getState().rooms[0]?.selections[categoryIds.floor]).toEqual(
      {
        productId: productIds.laminatePremium,
        disabled: false,
        source: 'manual',
      },
    );
    expect(useDraft.getState().styleId).toBe(styleIds.modern);
  });

  it('reconciles without default materials when the style was removed', async () => {
    seedDraft('removed');

    await renderFailingMaterials('removed');

    expect(useDraft.getState().styleId).toBeNull();
    expect(
      useDraft.getState().rooms[0]?.selections[categoryIds.floor]?.productId,
    ).toBeNull();
  });
});
