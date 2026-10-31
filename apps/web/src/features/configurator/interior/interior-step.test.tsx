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

function roomSection(name: string) {
  return screen.getByRole('region', { name: new RegExp(name) });
}

function categoryRows(name = 'Living room') {
  return within(within(roomSection(name)).getByRole('list')).getAllByRole(
    'listitem',
  );
}

function rowButton(row: HTMLElement) {
  return within(row).getAllByRole('button')[0];
}

function productCards(root: HTMLElement) {
  return within(root).getAllByRole('listitem');
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

function chooseButton(root: HTMLElement, name: string) {
  return within(cardNamed(root, name)).getByRole('button', {
    name: `Choose: ${name}`,
  });
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

    expect(categoryRows().map((row) => rowButton(row).textContent)).toEqual([
      expect.stringMatching(/Flooring/),
      expect.stringMatching(/Walls/),
      expect.stringMatching(/Ceiling/),
    ]);
  });

  it('shows the own category set of the kitchen-living room', async () => {
    await renderStep(`/configurator/interior?room=${kitchenLivingId}`, {
      draft: makeKitchenLivingDraft(),
    });

    const rows = categoryRows('Kitchen');
    expect(rows).toHaveLength(2);
    expect(rowButton(rows[0]).textContent).toMatch(/Walls/);
    expect(rowButton(rows[1]).textContent).toMatch(/Flooring/);
    expect(within(rows[1]).getByText(en.ChosenList.choose)).toBeInTheDocument();
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
        chooseButton(showcase('Flooring'), 'Walnut Premium Laminate'),
      );
    });

    const after = panelOf(currentDraft());
    expect(after.materials?.usdCents).not.toBe(before.materials?.usdCents);
    expect(categoryRows()[0]).toHaveTextContent('Walnut Premium Laminate');
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

  it('removes the ceiling from the estimate and re-adds it', async () => {
    await renderStep(
      `/configurator/interior?room=${livingId}&category=${categoryIds.ceiling}`,
    );
    const before = panelOf(currentDraft());
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', {
          name: /Remove Ceiling from Living room/,
        }),
      );
    });

    const ceilingRow = categoryRows()[2];
    expect(
      within(ceilingRow).getByText(en.ChosenList.excluded),
    ).toBeInTheDocument();
    expect(ceilingRow).not.toHaveTextContent('Matt Ceiling Paint');
    expect(screen.getByText(en.ProductShowcase.excluded)).toBeInTheDocument();
    expect(panelOf(currentDraft()).materials?.usdCents).toBeLessThan(
      before.materials?.usdCents ?? 0,
    );

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: /Add Ceiling to Living room/ }),
      );
    });

    expect(categoryRows()[2]).toHaveTextContent('Matt Ceiling Paint');
    expect(panelOf(currentDraft()).materials?.usdCents).toBe(
      before.materials?.usdCents,
    );
  });

  it('re-enables an excluded category by choosing a product in the picker', async () => {
    await renderStep(
      `/configurator/interior?room=${livingId}&category=${categoryIds.floor}`,
    );

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', {
          name: /Remove Flooring from Living room/,
        }),
      );
    });
    await act(async () => {
      fireEvent.click(
        chooseButton(showcase('Flooring'), 'Stone Grey Porcelain Tile'),
      );
    });

    expect(
      useDraft.getState().rooms[0].selections[categoryIds.floor],
    ).toMatchObject({ productId: productIds.tile, disabled: false });
    expect(categoryRows()[0]).toHaveTextContent('Stone Grey Porcelain Tile');
  });

  it('groups the chosen list by room and opens another room from a row', async () => {
    const { location } = await renderStep(
      `/configurator/interior?room=${livingId}&category=${categoryIds.floor}`,
    );

    expect(roomSection('Living room')).toBeInTheDocument();
    expect(roomSection('Bathroom')).toBeInTheDocument();
    expect(roomSection('Bedroom')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(rowButton(categoryRows('Bedroom')[1]));
    });

    const search = new URLSearchParams(location().search);
    expect(search.get('room')).toBe(bedroomId);
    expect(search.get('category')).toBe(categoryIds.walls);
  });

  it('leaves a category without products out of the chosen list and shows the empty state in the picker', async () => {
    await renderStep(
      `/configurator/interior?room=${bedroomId}&category=${categoryIds.ceiling}`,
    );

    expect(categoryRows('Bedroom')).toHaveLength(2);
    expect(screen.getByText(en.Specification.emptyTitle)).toBeInTheDocument();
  });

  it('selects a product with one click in the picker and shows it in the chosen list', async () => {
    await renderStep(
      `/configurator/interior?room=${livingId}&category=${categoryIds.floor}`,
    );

    await act(async () => {
      fireEvent.click(
        chooseButton(showcase('Flooring'), 'Stone Grey Porcelain Tile'),
      );
    });

    expect(
      useDraft.getState().rooms[0].selections[categoryIds.floor]?.productId,
    ).toBe(productIds.tile);
    expect(categoryRows()[0]).toHaveTextContent('Stone Grey Porcelain Tile');
  });

  it('switches the active category from the chosen list', async () => {
    const { location } = await renderStep(
      `/configurator/interior?room=${livingId}&category=${categoryIds.floor}`,
    );

    await act(async () => {
      fireEvent.click(rowButton(categoryRows()[1]));
    });

    expect(new URLSearchParams(location().search).get('category')).toBe(
      categoryIds.walls,
    );
    expect(rowButton(categoryRows()[1])).toHaveAttribute(
      'aria-current',
      'true',
    );
    expect(
      chooseButton(showcase('Walls'), 'Silk White Wall Paint'),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows no picker inline at 390 px', async () => {
    await renderStep(
      `/configurator/interior?room=${livingId}&category=${categoryIds.floor}`,
      { viewport: 390 },
    );

    expect(screen.queryByRole('list', { name: 'Flooring' })).toBeNull();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: en.ChosenList.openPicker }),
    ).toBeInTheDocument();
  });

  it('opens the picker in a bottom sheet at 390 px and closes it on choice', async () => {
    await renderStep(
      `/configurator/interior?room=${livingId}&category=${categoryIds.floor}`,
      { viewport: 390 },
    );

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: en.ChosenList.openPicker }),
      );
    });
    const sheet = screen.getByRole('dialog', { name: en.Specification.title });
    await act(async () => {
      fireEvent.click(chooseButton(sheet, 'Stone Grey Porcelain Tile'));
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      useDraft.getState().rooms[0].selections[categoryIds.floor]?.productId,
    ).toBe(productIds.tile);
  });

  it('opens the sheet on the tapped category from the chosen list at 390 px', async () => {
    const { location } = await renderStep(
      `/configurator/interior?room=${livingId}&category=${categoryIds.floor}`,
      { viewport: 390 },
    );

    await act(async () => {
      fireEvent.click(rowButton(categoryRows()[1]));
    });

    const sheet = screen.getByRole('dialog', { name: en.Specification.title });
    expect(new URLSearchParams(location().search).get('category')).toBe(
      categoryIds.walls,
    );
    expect(chooseButton(sheet, 'Silk White Wall Paint')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('closes the detail and the sheet on a phone when chosen from the detail', async () => {
    await renderStep(
      `/configurator/interior?room=${livingId}&category=${categoryIds.floor}`,
      { viewport: 390 },
    );

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: en.ChosenList.openPicker }),
      );
    });
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

    expect(
      within(
        screen.getByRole('group', { name: en.InteriorStep.switcherLabel }),
      ).getAllByRole('button')[1],
    ).toHaveAttribute('aria-current', 'true');
    expect(rowButton(categoryRows('Bathroom')[1])).toHaveAttribute(
      'aria-current',
      'true',
    );
    expect(
      chooseButton(showcase('Walls'), 'Silk White Wall Paint'),
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
        screen.getByRole('heading', { name: text.ChosenList.title }),
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
