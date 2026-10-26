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
import { makeInteriorDraft } from '@/test/fixtures/draft';
import {
  createTestQueryClient,
  forEachLocale,
  renderWithProviders,
} from '@/test/render-with-providers';
import en from '../../../../../messages/en.json';
import { ShowcaseSlotContext } from '../../shell/ShowcaseSlot/showcase-slot-context';
import { ProductShowcase } from './ProductShowcase';

vi.mock('@/lib/api/client', () => ({ api: { GET: vi.fn() } }));

const category = { id: categoryIds.floor, name: 'Flooring', position: 1 };

type Placement = 'sheet' | 'zone';

function Harness({
  placement,
  onCategoryChange,
  onOpenDetail,
}: {
  placement: Placement;
  onCategoryChange: (id: string | null) => void;
  onOpenDetail: (id: string) => void;
}) {
  const room = useDraft((state) => state.rooms[0]);
  return (
    <ProductShowcase
      room={room}
      category={category}
      placement={placement}
      onCategoryChange={onCategoryChange}
      onOpenDetail={onOpenDetail}
    />
  );
}

async function renderShowcase(
  placement: Placement,
  options: Parameters<typeof renderWithProviders>[1] = {},
) {
  useDraft.setState({ ...makeInteriorDraft(), revision: 1 });
  const onCategoryChange = vi.fn();
  const onOpenDetail = vi.fn();
  const slot = document.createElement('div');
  document.body.append(slot);
  let result!: ReturnType<typeof renderWithProviders>;
  await act(async () => {
    result = renderWithProviders(
      <ShowcaseSlotContext value={slot}>
        <Harness
          placement={placement}
          onCategoryChange={onCategoryChange}
          onOpenDetail={onOpenDetail}
        />
      </ShowcaseSlotContext>,
      options,
    );
  });
  return { ...result, onCategoryChange, onOpenDetail, slot };
}

function cards(root: HTMLElement) {
  return within(root)
    .getAllByRole('button')
    .filter((button) => button.hasAttribute('aria-pressed'));
}

function cardNamed(root: HTMLElement, name: string) {
  const found = cards(root).find((card) => card.textContent?.includes(name));
  if (!found) {
    throw new Error(`No card named ${name}`);
  }
  return found;
}

function unitPrices(root: HTMLElement) {
  return cards(root).map((card) =>
    Number(/\$([\d.]+)per/.exec(card.textContent ?? '')?.[1]),
  );
}

describe('ProductShowcase', () => {
  beforeEach(() => {
    installMemoryStorage();
    clearEstimateCache();
    clearCardCostCache();
    resetWarmup();
    vi.mocked(api.GET).mockReset();
  });

  it('renders cards in the showcase zone with unit price, room cost and the picked marker', async () => {
    const { slot } = await renderShowcase('zone');

    const laminate = cardNamed(slot, 'Oak Natural Laminate');
    expect(laminate).toHaveAttribute('aria-pressed', 'true');
    expect(laminate).toHaveTextContent('$18');
    expect(laminate).toHaveTextContent(en.ProductShowcase.forRoom);
    expect(laminate).toHaveTextContent(en.ProductShowcase.picked);
    expect(cardNamed(slot, 'Stone Grey Porcelain Tile')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('sorts by price in both directions', async () => {
    const { slot } = await renderShowcase('zone');
    const select = within(slot).getByLabelText(en.ProductShowcase.sortLabel);

    await act(async () => {
      fireEvent.change(select, { target: { value: 'asc' } });
    });
    const ascending = unitPrices(slot);
    expect(ascending).toEqual([...ascending].sort((a, b) => a - b));

    await act(async () => {
      fireEvent.change(select, { target: { value: 'desc' } });
    });
    const descending = unitPrices(slot);
    expect(descending).toEqual([...descending].sort((a, b) => b - a));
    expect(descending).toEqual([...ascending].reverse());
  });

  it('opens in a bottom sheet on phones and closes when a product is chosen', async () => {
    const { onCategoryChange } = await renderShowcase('sheet');
    const dialog = screen.getByRole('dialog', { name: 'Flooring' });

    await act(async () => {
      fireEvent.click(cardNamed(dialog, 'Stone Grey Porcelain Tile'));
    });

    expect(useDraft.getState().rooms[0].selections[categoryIds.floor]).toEqual({
      productId: productIds.tile,
      disabled: false,
      source: 'manual',
    });
    expect(onCategoryChange).toHaveBeenCalledWith(null);
  });

  it('closes the sheet without changing the selection', async () => {
    const { onCategoryChange } = await renderShowcase('sheet');

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: en.ProductShowcase.close }),
      );
    });

    expect(onCategoryChange).toHaveBeenCalledWith(null);
    expect(
      useDraft.getState().rooms[0].selections[categoryIds.floor]?.productId,
    ).toBe(productIds.laminate);
  });

  it('keeps the zone open after choosing and exposes the detail action', async () => {
    const { slot, onCategoryChange, onOpenDetail } =
      await renderShowcase('zone');

    await act(async () => {
      fireEvent.click(cardNamed(slot, 'Stone Grey Porcelain Tile'));
    });
    await act(async () => {
      fireEvent.click(
        within(slot).getByRole('button', {
          name: 'Details: Oak Natural Laminate',
        }),
      );
    });

    expect(
      useDraft.getState().rooms[0].selections[categoryIds.floor]?.productId,
    ).toBe(productIds.tile);
    expect(onCategoryChange).not.toHaveBeenCalled();
    expect(onOpenDetail).toHaveBeenCalledWith(productIds.laminate);
  });

  it('refreshes the catalog and warns when the category is gone', async () => {
    useWarmup.setState({ server: 'ready' });
    vi.mocked(api.GET).mockResolvedValue({
      data: undefined,
      error: { error: { code: 'NOT_FOUND' } },
      response: { status: 404 },
    } as never);
    const queryClient = createTestQueryClient();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { onCategoryChange } = await renderShowcase('zone', {
      catalog: false,
      queryClient,
    });

    expect(
      await screen.findByText(en.ProductShowcase.categoryGone),
    ).toBeInTheDocument();
    expect(onCategoryChange).toHaveBeenCalledWith(null);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['room-types'] });
  });

  it.each(forEachLocale)('has no axe violations in %s', async (locale) => {
    const { slot } = await renderShowcase('zone', { locale });

    expect(await axe(slot)).toHaveNoViolations();
  });
});
