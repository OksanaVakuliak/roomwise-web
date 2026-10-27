import { act, fireEvent, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api/client';
import { clearCardCostCache } from '@/lib/engine/card-cost';
import { clearEstimateCache, runEstimate } from '@/lib/engine/run-estimate';
import { moneyMinor } from '@/lib/format';
import { installMemoryStorage } from '@/lib/theme/test-utils';
import { resetWarmup, useWarmup } from '@/lib/warmup/warmup';
import { useDraft } from '@/stores/draft';
import { axe } from '@/test/axe';
import {
  categoryIds,
  makeRoomTypes,
  productIds,
  type RoomTypesResponse,
} from '@/test/fixtures/catalog';
import {
  type DraftV1,
  makeDraftRoom,
  makeInteriorDraft,
} from '@/test/fixtures/draft';
import { makePricingData } from '@/test/fixtures/pricing-data';
import {
  createTestQueryClient,
  forEachLocale,
  renderWithProviders,
  seedCatalog,
} from '@/test/render-with-providers';
import { setViewport } from '@/test/viewports';
import en from '../../../../messages/en.json';
import uk from '../../../../messages/uk.json';
import { ConfiguratorShell } from '../shell/ConfiguratorShell/ConfiguratorShell';
import { InteriorStep } from './InteriorStep/InteriorStep';

vi.mock('@/lib/api/client', () => ({ api: { GET: vi.fn() } }));

const noLandmarkRule = { rules: { region: { enabled: false } } };
const catalogs = { en, uk };
const pricing = makePricingData();

const livingId = '00000000-0000-4000-8000-000000000301';
const bathroomId = '00000000-0000-4000-8000-000000000302';
const bedroomId = '00000000-0000-4000-8000-000000000303';
const kitchenLivingId = '00000000-0000-4000-8000-000000000304';

const FLOOR_NAMES = [
  'Oak Natural Laminate',
  'Stone Grey Porcelain Tile',
  'Walnut Premium Laminate',
];

function styleSelection(productId: string) {
  return { productId, disabled: false, source: 'style' as const };
}

function makeDraft(): DraftV1 {
  const base = makeInteriorDraft();
  return {
    ...base,
    rooms: [
      ...base.rooms,
      makeDraftRoom({
        clientId: bedroomId,
        roomTypeCode: 'BEDROOM',
        lengthM: 4,
        widthM: 3,
        selections: {
          [categoryIds.floor]: styleSelection(productIds.laminate),
          [categoryIds.walls]: styleSelection(productIds.paint),
        },
      }),
    ],
  };
}

function makeKitchenLivingDraft(): DraftV1 {
  const base = makeInteriorDraft();
  return {
    ...base,
    object: { ...base.object, kitchenType: 'KITCHEN_LIVING' },
    rooms: [
      makeDraftRoom({
        clientId: kitchenLivingId,
        roomTypeCode: 'KITCHEN_LIVING',
        lengthM: 6,
        widthM: 4,
        selections: {
          [categoryIds.walls]: styleSelection(productIds.paint),
        },
      }),
      base.rooms[1],
    ],
  };
}

function makeCatalog(): RoomTypesResponse {
  const base = makeRoomTypes();
  const [floor, walls, ceiling] = base.items[0].categories;
  return {
    items: base.items.map((type) => {
      if (type.code === 'KITCHEN_LIVING') {
        return { ...type, categories: [walls, floor] };
      }
      if (type.code === 'BEDROOM') {
        return {
          ...type,
          categories: [floor, walls, { ...ceiling, productCount: 0 }],
        };
      }
      return type;
    }),
  };
}

type StepOptions = NonNullable<Parameters<typeof renderWithProviders>[1]> & {
  viewport?: number;
  draft?: DraftV1;
};

async function renderStep(url: string, options: StepOptions = {}) {
  const { viewport = 1024, draft = makeDraft(), ...rest } = options;
  setViewport(viewport);
  useDraft.setState({ ...draft, revision: 1 });
  const locale = rest.locale ?? 'en';
  const queryClient = rest.queryClient ?? createTestQueryClient();
  seedCatalog(queryClient, locale);
  queryClient.setQueryData(['room-types', locale], makeCatalog());
  let result!: ReturnType<typeof renderWithProviders>;
  await act(async () => {
    result = renderWithProviders(
      <ConfiguratorShell>
        <InteriorStep />
      </ConfiguratorShell>,
      { url, ...rest, catalog: false, queryClient },
    );
  });
  return result;
}

function categoryRows() {
  const region = screen.getByRole('region', { name: en.CategoryList.title });
  return within(region).getAllByRole('listitem');
}

function productCards(root: HTMLElement) {
  return within(root)
    .getAllByRole('button')
    .filter((button) => button.hasAttribute('aria-pressed'));
}

function showcase(name: string) {
  return screen.getByRole('list', { name });
}

function cardNamed(root: HTMLElement, name: string) {
  const found = productCards(root).find((card) =>
    card.textContent?.includes(name),
  );
  if (!found) {
    throw new Error(`No card named ${name}`);
  }
  return found;
}

function currentDraft(): DraftV1 {
  const { rooms, options, object, styleId, step, furthestStep, lastSaved } =
    useDraft.getState();
  return { rooms, options, object, styleId, step, furthestStep, lastSaved };
}

function panelOf(draft: DraftV1) {
  return runEstimate({
    draft,
    draftRevision: 1,
    pricing,
    pricingVersion: pricing.version,
    currency: 'UAH',
  }).panel;
}

function usd(cents: number | undefined) {
  return moneyMinor(cents ?? 0, 'USD', 'en');
}

function costRow(label: string) {
  const term = screen.getByText(label, { selector: 'dt' });
  return within(term.parentElement as HTMLElement).getByRole('definition');
}

describe('InteriorStep integration', () => {
  beforeEach(() => {
    installMemoryStorage();
    clearEstimateCache();
    clearCardCostCache();
    resetWarmup();
    vi.mocked(api.GET).mockReset();
  });

  it('lists the categories of the room type in server order', async () => {
    await renderStep(`/configurator/interior?room=${livingId}`);

    expect(
      categoryRows().map((row) => within(row).getByRole('button').textContent),
    ).toEqual([
      expect.stringMatching(/^1Flooring/),
      expect.stringMatching(/^2Walls/),
      expect.stringMatching(/^3Ceiling/),
    ]);
  });

  it('shows the own category set of the kitchen-living room', async () => {
    await renderStep(`/configurator/interior?room=${kitchenLivingId}`, {
      draft: makeKitchenLivingDraft(),
    });

    const rows = categoryRows();
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByRole('button').textContent).toMatch(/^1Walls/);
    expect(within(rows[1]).getByRole('button').textContent).toMatch(
      /^2Flooring/,
    );
    expect(
      within(rows[1]).getByText(en.CategoryList.choose),
    ).toBeInTheDocument();
  });

  it('shows cards with the cost for the bedroom area', async () => {
    await renderStep(
      `/configurator/interior?room=${bedroomId}&category=${categoryIds.floor}`,
    );
    const list = showcase('Flooring');

    const laminate = cardNamed(list, 'Oak Natural Laminate');
    expect(laminate).toHaveTextContent(en.ProductShowcase.forRoom);
    expect(laminate).toHaveTextContent(usd(Math.round(12 * 1.05 * 2000)));
    expect(cardNamed(list, 'Stone Grey Porcelain Tile')).toHaveTextContent(
      usd(Math.round(12 * 1.1 * 3250)),
    );
  });

  it('sorts the showcase by price in both directions', async () => {
    await renderStep(
      `/configurator/interior?room=${livingId}&category=${categoryIds.floor}`,
    );
    const select = screen.getByLabelText(en.ProductShowcase.sortLabel);
    const order = () =>
      productCards(showcase('Flooring')).map((card) =>
        FLOOR_NAMES.find((name) => card.textContent?.includes(name)),
      );

    await act(async () => {
      fireEvent.change(select, { target: { value: 'asc' } });
    });
    expect(order()).toEqual(FLOOR_NAMES);

    await act(async () => {
      fireEvent.change(select, { target: { value: 'desc' } });
    });
    expect(order()).toEqual([...FLOOR_NAMES].reverse());
  });

  it('replacing a product updates the row, materials and total', async () => {
    await renderStep(
      `/configurator/interior?room=${livingId}&category=${categoryIds.floor}`,
    );
    const before = panelOf(currentDraft());
    expect(costRow(en.CostPanel.materials)).toHaveTextContent(
      usd(before.materials?.usdCents),
    );

    await act(async () => {
      fireEvent.click(
        cardNamed(showcase('Flooring'), 'Walnut Premium Laminate'),
      );
    });

    const after = panelOf(currentDraft());
    expect(after.materials?.usdCents).not.toBe(before.materials?.usdCents);
    expect(
      within(categoryRows()[0]).getByText('Walnut Premium Laminate'),
    ).toBeInTheDocument();
    expect(costRow(en.CostPanel.materials)).toHaveTextContent(
      usd(after.materials?.usdCents),
    );
    expect(
      screen.getAllByText(usd(after.total?.usdCents)).length,
    ).toBeGreaterThan(0);
  });

  it('opens the enlarged view with gallery and attributes and chooses from it', async () => {
    await renderStep(
      `/configurator/interior?room=${livingId}&category=${categoryIds.floor}`,
    );

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', {
          name: 'Details: Walnut Premium Laminate',
        }),
      );
    });

    const dialog = screen.getByRole('dialog', {
      name: 'Walnut Premium Laminate',
    });
    expect(
      within(dialog).getByRole('group', { name: en.ProductDetail.gallery }),
    ).toBeInTheDocument();
    expect(within(dialog).getByText('Thickness')).toBeInTheDocument();
    expect(within(dialog).getByText('8 mm')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(
        within(dialog).getByRole('button', { name: en.ProductDetail.choose }),
      );
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      useDraft.getState().rooms[0].selections[categoryIds.floor]?.productId,
    ).toBe(productIds.laminatePremium);
  });

  it('marks the current selection as chosen in the enlarged view', async () => {
    await renderStep(
      `/configurator/interior?room=${livingId}&category=${categoryIds.floor}`,
    );

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Details: Oak Natural Laminate' }),
      );
    });

    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByRole('button', { name: en.ProductDetail.picked }),
    ).toBeDisabled();
    expect(
      within(dialog).queryByRole('button', { name: en.ProductDetail.choose }),
    ).not.toBeInTheDocument();
  });

  it('says the product is gone on 404 and offers no choice', async () => {
    useWarmup.setState({ server: 'ready' });
    vi.mocked(api.GET).mockResolvedValue({
      data: undefined,
      error: { error: { code: 'NOT_FOUND' } },
      response: { status: 404 },
    } as never);
    const { queryClient } = await renderStep(
      `/configurator/interior?room=${livingId}&category=${categoryIds.floor}`,
    );
    await act(async () => {
      queryClient.removeQueries({
        queryKey: ['product', productIds.tile, 'en'],
      });
    });

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', {
          name: 'Details: Stone Grey Porcelain Tile',
        }),
      );
    });

    const dialog = await screen.findByRole('dialog');
    expect(
      await within(dialog).findByText(en.ProductDetail.gone),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByRole('button', { name: en.ProductDetail.choose }),
    ).not.toBeInTheDocument();
  });

  it('excludes the ceiling from the estimate and restores the choice on enable', async () => {
    await renderStep(`/configurator/interior?room=${livingId}`);
    const toggle = screen.getByRole('switch', {
      name: 'Include Ceiling in the estimate',
    });
    const before = panelOf(currentDraft());

    await act(async () => {
      fireEvent.click(toggle);
    });

    const ceilingRow = categoryRows()[2];
    expect(
      within(ceilingRow).getByText(en.CategoryList.excluded),
    ).toBeInTheDocument();
    expect(
      within(ceilingRow).queryByText('Matt Ceiling Paint'),
    ).not.toBeInTheDocument();
    expect(panelOf(currentDraft()).materials?.usdCents).toBeLessThan(
      before.materials?.usdCents ?? 0,
    );

    await act(async () => {
      fireEvent.click(toggle);
    });

    expect(
      within(categoryRows()[2]).getByText('Matt Ceiling Paint'),
    ).toBeInTheDocument();
    expect(panelOf(currentDraft()).materials?.usdCents).toBe(
      before.materials?.usdCents,
    );
  });

  it('shows the empty state for a category without products', async () => {
    await renderStep(`/configurator/interior?room=${bedroomId}`);

    const ceiling = categoryRows()[2];
    expect(
      within(ceiling).getByText(en.CategoryList.empty),
    ).toBeInTheDocument();
    expect(within(ceiling).getByRole('button')).toBeDisabled();
    expect(within(ceiling).queryByRole('switch')).not.toBeInTheDocument();
  });

  it('opens the showcase in a bottom sheet at 390 px and closes it on choice', async () => {
    const { location } = await renderStep(
      `/configurator/interior?room=${livingId}&category=${categoryIds.floor}`,
      { viewport: 390 },
    );
    const sheet = screen.getByRole('dialog', { name: 'Flooring' });

    await act(async () => {
      fireEvent.click(cardNamed(sheet, 'Stone Grey Porcelain Tile'));
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(new URLSearchParams(location().search).has('category')).toBe(false);
    expect(
      useDraft.getState().rooms[0].selections[categoryIds.floor]?.productId,
    ).toBe(productIds.tile);
  });

  it('closes the detail and the sheet on a phone when chosen from the detail', async () => {
    await renderStep(
      `/configurator/interior?room=${livingId}&category=${categoryIds.floor}`,
      { viewport: 390 },
    );

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', {
          name: 'Details: Stone Grey Porcelain Tile',
        }),
      );
    });
    const detail = screen.getByRole('dialog', {
      name: 'Stone Grey Porcelain Tile',
    });
    await act(async () => {
      fireEvent.click(
        within(detail).getByRole('button', { name: en.ProductDetail.choose }),
      );
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      useDraft.getState().rooms[0].selections[categoryIds.floor]?.productId,
    ).toBe(productIds.tile);
  });

  it('restores the room and the category from the query', async () => {
    await renderStep(
      `/configurator/interior?room=${bathroomId}&category=${categoryIds.walls}`,
    );

    expect(screen.getAllByRole('tab')[1]).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('button', { name: /Walls/ })).toHaveAttribute(
      'aria-current',
      'true',
    );
    expect(
      cardNamed(showcase('Walls'), 'Silk White Wall Paint'),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it.each(forEachLocale)(
    'renders in %s without axe violations',
    async (locale) => {
      await renderStep(
        `/configurator/interior?room=${livingId}&category=${categoryIds.floor}`,
        { locale },
      );
      const text = catalogs[locale];

      expect(
        screen.getByRole('heading', { name: text.CategoryList.title }),
      ).toBeInTheDocument();
      expect(await axe(document.body, noLandmarkRule)).toHaveNoViolations();

      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', {
            name: text.ProductShowcase.detailLabel.replace(
              '{name}',
              'Oak Natural Laminate',
            ),
          }),
        );
      });

      expect(
        within(screen.getByRole('dialog')).getByText(text.ProductDetail.picked),
      ).toBeInTheDocument();
      expect(await axe(document.body, noLandmarkRule)).toHaveNoViolations();
    },
  );
});
