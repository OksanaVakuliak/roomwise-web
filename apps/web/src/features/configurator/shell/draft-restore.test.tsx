import { act, fireEvent, screen, within } from '@testing-library/react';
import type { Locale } from 'next-intl';
import { useId } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PageTitle } from '@/components/ui';
import { api } from '@/lib/api/client';
import { fetchPricingData } from '@/lib/api/pricing-data';
import { DRAFT_VERSION } from '@/lib/draft/migrate';
import { createDefaultDraft } from '@/lib/draft/schema';
import { clearEstimateCache, runEstimate } from '@/lib/engine/run-estimate';
import { moneyMinor } from '@/lib/format';
import { installMemoryStorage } from '@/lib/theme/test-utils';
import { DRAFT_STORAGE_KEY, useDraft } from '@/stores/draft';
import { checkPricingData, resetPricingData } from '@/stores/pricing-data';
import { categoryIds, productIds } from '@/test/fixtures/catalog';
import { type DraftV1, makeInteriorDraft } from '@/test/fixtures/draft';
import { makePricingData } from '@/test/fixtures/pricing-data';
import {
  forEachLocale,
  renderWithProviders,
} from '@/test/render-with-providers';
import { setViewport } from '@/test/viewports';
import en from '../../../../messages/en.json';
import uk from '../../../../messages/uk.json';
import { InteriorStep } from '../interior/InteriorStep/InteriorStep';
import { ConfiguratorShell } from './ConfiguratorShell/ConfiguratorShell';

vi.mock('@/lib/api/client', () => ({ api: { GET: vi.fn() } }));
vi.mock('@/lib/api/pricing-data', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api/pricing-data')>()),
  fetchPricingData: vi.fn(),
}));

const catalogs = { en, uk };
const livingId = '00000000-0000-4000-8000-000000000301';
const bathroomId = '00000000-0000-4000-8000-000000000302';

type Pricing = ReturnType<typeof makePricingData>;

function Page() {
  const id = useId();
  return (
    <>
      <PageTitle>Step content</PageTitle>
      <input id={id} aria-label="Field" />
    </>
  );
}

function resetMemory() {
  useDraft.setState({
    ...createDefaultDraft(),
    revision: 0,
    storageAvailable: true,
    notice: null,
    heatedFloorReset: false,
    replacements: [],
  });
}

async function reload(persisted: unknown, version = DRAFT_VERSION) {
  resetMemory();
  localStorage.setItem(
    DRAFT_STORAGE_KEY,
    JSON.stringify({ state: persisted, version }),
  );
  await act(async () => {
    await useDraft.persist.rehydrate();
  });
}

async function renderShell(
  url: string,
  options: { locale?: Locale; interior?: boolean; pricing?: Pricing } = {},
) {
  const { locale = 'en', interior = false, pricing } = options;
  setViewport(1440);
  let result!: ReturnType<typeof renderWithProviders>;
  await act(async () => {
    result = renderWithProviders(
      <ConfiguratorShell>
        {interior ? <InteriorStep /> : <Page />}
      </ConfiguratorShell>,
      { locale, url, ...(pricing ? { pricing } : {}) },
    );
  });
  return result;
}

function totalOf(draft: DraftV1, pricing: Pricing) {
  const { total } = runEstimate({
    draft,
    draftRevision: useDraft.getState().revision,
    pricing,
    pricingVersion: pricing.version,
    currency: 'UAH',
  }).panel;
  return moneyMinor(total?.usdCents ?? 0, 'USD', 'en');
}

function withUnavailable(...ids: string[]) {
  const base = makePricingData();
  return makePricingData({
    products: base.products.map((product) =>
      ids.includes(product.id) ? { ...product, available: false } : product,
    ),
  });
}

function premiumFloorDraft() {
  const draft = makeInteriorDraft();
  return {
    ...draft,
    rooms: draft.rooms.map((room) =>
      room.clientId === livingId
        ? {
            ...room,
            selections: {
              ...room.selections,
              [categoryIds.floor]: {
                productId: productIds.laminatePremium,
                disabled: false,
                source: 'manual' as const,
              },
            },
          }
        : room,
    ),
  };
}

function livingFloor() {
  return useDraft.getState().rooms.find((room) => room.clientId === livingId)
    ?.selections[categoryIds.floor];
}

describe('draft survives a reload', () => {
  beforeEach(() => {
    installMemoryStorage();
    clearEstimateCache();
    resetPricingData();
    resetMemory();
    vi.mocked(api.GET).mockReset();
    vi.mocked(fetchPricingData).mockReset();
  });

  it('restores the interior step with the selected room and its data', async () => {
    const draft = makeInteriorDraft();
    await reload(draft);

    const { location } = await renderShell(
      `/configurator/interior?room=${bathroomId}`,
      { interior: true },
    );

    expect(
      await screen.findByRole('region', { name: /Bathroom/ }),
    ).toBeVisible();
    expect(location().pathname).toBe('/en/configurator/interior');
    expect(location().searchParams.get('room')).toBe(bathroomId);
    expect(useDraft.getState().rooms).toEqual(draft.rooms);
    expect(useDraft.getState().step).toBe('interior');
    expect(
      screen.queryByText(en.DraftNotices.draftReset),
    ).not.toBeInTheDocument();
  });

  it('announces updated prices with the new total after a pricing refresh', async () => {
    const draft = makeInteriorDraft();
    await reload(draft);
    const before = makePricingData();
    const after = makePricingData({
      version: 'fedcba9876543210',
      products: before.products.map((product) =>
        product.id === productIds.laminate
          ? { ...product, priceCents: product.priceCents + 5000 }
          : product,
      ),
    });
    vi.mocked(fetchPricingData).mockResolvedValue({
      kind: 'modified',
      data: after,
      etag: 'v2',
    });
    await renderShell('/configurator/interior', { pricing: before });
    const oldTotal = totalOf(draft, before);
    const newTotal = totalOf(draft, after);
    expect(newTotal).not.toBe(oldTotal);
    const cost = screen.getByRole('region', { name: en.StepLayout.cost });
    expect(within(cost).getAllByText(oldTotal).length).toBeGreaterThan(0);

    await act(async () => {
      await checkPricingData();
    });

    expect(
      await screen.findByText(
        en.DraftNotices.pricesUpdatedWithTotal.replace('{total}', newTotal),
      ),
    ).toBeInTheDocument();
    expect(await within(cost).findAllByText(newTotal)).not.toHaveLength(0);
    expect(within(cost).queryByText(oldTotal)).not.toBeInTheDocument();
  });

  it('replaces an unavailable product with the style material and lists it', async () => {
    await reload(premiumFloorDraft());

    await renderShell(`/configurator/interior?room=${livingId}`, {
      interior: true,
      pricing: withUnavailable(productIds.laminatePremium),
    });

    const item = await screen.findByText(
      en.DraftNotices.replacedWithStyle
        .replace('{room}', 'Living room 1')
        .replace('{category}', 'Flooring')
        .replace('{product}', 'Oak Natural Laminate'),
    );
    expect(item.closest('li')).not.toBeNull();
    expect(livingFloor()).toMatchObject({
      productId: productIds.laminate,
      source: 'style',
    });
  });

  it('asks to choose a material when the style default is unavailable too', async () => {
    await reload(premiumFloorDraft());

    await renderShell(`/configurator/interior?room=${livingId}`, {
      interior: true,
      pricing: withUnavailable(productIds.laminatePremium, productIds.laminate),
    });

    expect(
      await screen.findByText(
        en.DraftNotices.chooseMaterial
          .replace('{room}', 'Living room 1')
          .replace('{category}', 'Flooring'),
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/style material/)).not.toBeInTheDocument();
    expect(livingFloor()?.productId).toBeNull();
  });

  it.each(forEachLocale)(
    'reports an incompatible saved draft and opens the object step in %s',
    async (locale) => {
      await reload({ unexpected: true }, DRAFT_VERSION + 1);

      const { location } = await renderShell('/configurator/interior', {
        locale,
      });

      expect(
        await screen.findByText(catalogs[locale].DraftNotices.draftReset),
      ).toBeInTheDocument();
      expect(location().pathname).toBe(`/${locale}/configurator/object`);
      expect(useDraft.getState().rooms).toEqual([]);
      expect(useDraft.getState().furthestStep).toBe('object');
    },
  );

  it('reports a saved draft that is not valid JSON', async () => {
    resetMemory();
    localStorage.setItem(DRAFT_STORAGE_KEY, '{not json');
    await act(async () => {
      await useDraft.persist.rehydrate();
    });

    const { location } = await renderShell('/configurator/interior');

    expect(
      await screen.findByText(en.DraftNotices.draftReset),
    ).toBeInTheDocument();
    expect(location().pathname).toBe('/en/configurator/object');
  });

  it('clears the draft and opens the object step when Start over is confirmed', async () => {
    await reload(makeInteriorDraft({ step: 'result', furthestStep: 'result' }));
    const { location } = await renderShell('/configurator/result');

    fireEvent.click(
      await screen.findByRole('button', { name: en.Configurator.startOver }),
    );
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(
      within(dialog).getByRole('button', {
        name: en.Configurator.startOverConfirm,
      }),
    );

    expect(useDraft.getState().rooms).toEqual([]);
    expect(useDraft.getState().step).toBe('object');
    expect(useDraft.getState().furthestStep).toBe('object');
    expect(location().pathname).toBe('/en/configurator/object');
    const saved = JSON.parse(localStorage.getItem(DRAFT_STORAGE_KEY) ?? '{}');
    expect(saved.state.rooms).toEqual([]);
  });

  it('applies a draft written by another tab', async () => {
    const draft = makeInteriorDraft();
    await reload(draft);
    await renderShell(`/configurator/interior?room=${livingId}`, {
      interior: true,
    });
    await screen.findByRole('region', { name: /Living room/ });

    const renamed = {
      ...draft,
      rooms: draft.rooms.map((room) =>
        room.clientId === livingId ? { ...room, name: 'Guest hall' } : room,
      ),
    };
    localStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({ state: renamed, version: DRAFT_VERSION }),
    );
    await act(async () => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: DRAFT_STORAGE_KEY }),
      );
    });

    expect(
      await screen.findByRole('region', { name: /Guest hall/ }),
    ).toBeInTheDocument();
  });
});
