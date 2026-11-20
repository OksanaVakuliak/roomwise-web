import { act, fireEvent, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api/client';
import { clearCardCostCache } from '@/lib/engine/card-cost';
import { clearEstimateCache } from '@/lib/engine/run-estimate';
import { installMemoryStorage } from '@/lib/theme/test-utils';
import { resetWarmup, useWarmup } from '@/lib/warmup/warmup';
import { useDraft } from '@/stores/draft';
import { axe } from '@/test/axe';
import { categoryIds, productIds } from '@/test/fixtures/catalog';
import { makeDraftRoom, makeInteriorDraft } from '@/test/fixtures/draft';
import { forEachLocale } from '@/test/render-with-providers';
import en from '../../../../messages/en.json';
import {
  bathroomId,
  bedroomId,
  cardNamed,
  catalogs,
  categoryRows,
  chooseButton,
  costRow,
  currentDraft,
  FLOOR_NAMES,
  kitchenLivingId,
  livingId,
  makeKitchenLivingDraft,
  noLandmarkRule,
  panelOf,
  productCards,
  renderStep,
  roomSection,
  rowButton,
  showcase,
  styleSelection,
  usd,
  wallpaperId,
} from './interior-step.helpers';

vi.mock('@/lib/api/client', () => ({ api: { GET: vi.fn() } }));

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
    expect(rowButton(rows[0]).textContent).toMatch(/Flooring/);
    expect(rowButton(rows[1]).textContent).toMatch(/Walls/);
    expect(within(rows[0]).getByText(en.ChosenList.choose)).toBeInTheDocument();
  });

  it('fills the hallway categories from the style and counts its materials', async () => {
    const hallwayId = '00000000-0000-4000-8000-000000000305';
    const base = makeInteriorDraft();
    const draft = {
      ...base,
      rooms: [
        makeDraftRoom({
          clientId: hallwayId,
          roomTypeCode: 'HALLWAY',
          lengthM: 5,
          widthM: 1.5,
          selections: {
            [categoryIds.floor]: styleSelection(productIds.laminate),
            [categoryIds.walls]: styleSelection(productIds.paint),
            [categoryIds.ceiling]: styleSelection(productIds.ceilingPaint),
          },
        }),
      ],
    };
    await renderStep(`/configurator/interior?room=${hallwayId}`, { draft });

    const rows = categoryRows('Hallway');
    expect(rows.map((row) => rowButton(row).textContent)).toEqual([
      expect.stringMatching(/Flooring/),
      expect.stringMatching(/Walls/),
      expect.stringMatching(/Ceiling/),
    ]);
    expect(rows[0]).toHaveTextContent('Oak Natural Laminate');
    expect(rows[1]).not.toHaveTextContent(en.ChosenList.choose);
    expect(rows[2]).not.toHaveTextContent(en.ChosenList.choose);

    const { materials } = panelOf(currentDraft());
    expect(materials?.usdCents).toBeGreaterThan(0);
    expect(costRow(en.CostPanel.materials)).toHaveTextContent(
      usd(materials?.usdCents),
    );
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
    expect(
      screen.queryByRole('switch', { name: en.HeatedFloorSwitch.title }),
    ).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', {
          name: /Remove Ceiling from Living room/,
        }),
      );
    });

    expect(categoryRows()).toHaveLength(2);
    expect(
      screen.queryByRole('button', { name: /Add Ceiling to Living room/ }),
    ).not.toBeInTheDocument();
    expect(
      categoryRows()
        .map((row) => row.textContent)
        .join(),
    ).not.toContain('Matt Ceiling Paint');
    expect(screen.getByText(en.ProductShowcase.excluded)).toBeInTheDocument();
    expect(panelOf(currentDraft()).materials?.usdCents).toBeLessThan(
      before.materials?.usdCents ?? 0,
    );

    await act(async () => {
      fireEvent.click(chooseButton(showcase('Ceiling'), 'Matt Ceiling Paint'));
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

  it('collapses and expands the rows of a room', async () => {
    await renderStep(
      `/configurator/interior?room=${livingId}&category=${categoryIds.floor}`,
    );
    const section = roomSection('Living room');
    const toggle = within(section).getByRole('button', {
      name: /^Collapse Living room/,
    });
    const list = within(section).getAllByRole('list')[0];

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(list.closest('[inert]')).toBeNull();

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAccessibleName(/^Expand Living room/);
    expect(list.closest('[inert]')).not.toBeNull();
    expect(
      within(roomSection('Bathroom'))
        .getAllByRole('list')[0]
        .closest('[inert]'),
    ).toBeNull();

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(list.closest('[inert]')).toBeNull();
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

  it('opens the picker in a bottom sheet on a 768 px tablet', async () => {
    await renderStep(
      `/configurator/interior?room=${livingId}&category=${categoryIds.floor}`,
      { viewport: 768 },
    );

    expect(screen.queryByRole('list', { name: 'Flooring' })).toBeNull();
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: en.ChosenList.openPicker }),
      );
    });
    expect(
      screen.getByRole('dialog', { name: en.Specification.title }),
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

  describe('one finish per surface', () => {
    const wallpaperDraft = () => {
      const base = makeInteriorDraft();
      return {
        ...base,
        rooms: [
          {
            ...base.rooms[0],
            selections: {
              ...base.rooms[0].selections,
              [wallpaperId]: {
                productId: productIds.paintPremium,
                disabled: true,
                source: 'style' as const,
              },
            },
          },
        ],
      };
    };

    it('groups the picker tabs by surface', async () => {
      await renderStep(
        `/configurator/interior?room=${livingId}&category=${categoryIds.walls}`,
        { draft: wallpaperDraft(), withWallpaper: true },
      );

      expect(
        screen
          .getAllByRole('tab')
          .map((tab) => tab.textContent)
          .slice(0, 3),
      ).toEqual([en.Surface.FLOOR, en.Surface.WALLS, en.Surface.CEILING]);
      const finish = screen.getByRole('group', {
        name: en.Specification.finishLabel,
      });
      expect(within(finish).getAllByRole('button')).toHaveLength(2);
      expect(
        screen.queryByText(/Currently chosen for/),
      ).not.toBeInTheDocument();
    });

    it('hints that the shown finish replaces the active one', async () => {
      await renderStep(
        `/configurator/interior?room=${livingId}&category=${wallpaperId}`,
        { draft: wallpaperDraft(), withWallpaper: true },
      );

      expect(
        screen.getByText(
          en.ProductShowcase.replaces
            .replace('{surface}', en.Surface.for.WALLS)
            .replace('{name}', 'Walls'),
        ),
      ).toBeInTheDocument();
    });

    it('lists one chosen row per surface', async () => {
      await renderStep(`/configurator/interior?room=${livingId}`, {
        draft: wallpaperDraft(),
        withWallpaper: true,
      });

      expect(categoryRows()).toHaveLength(3);
      expect(
        categoryRows().map((row) => rowButton(row).textContent),
      ).not.toContainEqual(expect.stringMatching(/Wallpaper/));
    });

    it('switching the finish type only changes the list, not the draft', async () => {
      await renderStep(
        `/configurator/interior?room=${livingId}&category=${categoryIds.walls}`,
        { draft: wallpaperDraft(), withWallpaper: true },
      );
      const before = currentDraft().rooms[0].selections;

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Wallpaper' }));
      });

      expect(currentDraft().rooms[0].selections).toEqual(before);
    });

    it('swaps the active finish when a product of the other one is chosen', async () => {
      await renderStep(
        `/configurator/interior?room=${livingId}&category=${wallpaperId}`,
        { draft: wallpaperDraft(), withWallpaper: true },
      );

      await act(async () => {
        fireEvent.click(
          within(showcase('Wallpaper')).getAllByRole('button', {
            name: /^Choose:/,
          })[0],
        );
      });

      const { selections } = currentDraft().rooms[0];
      expect(selections[wallpaperId]?.disabled).toBe(false);
      expect(selections[categoryIds.walls]?.disabled).toBe(true);
    });
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
    30_000,
  );
});
