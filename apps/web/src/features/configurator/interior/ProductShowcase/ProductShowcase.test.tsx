import { act, fireEvent, within } from '@testing-library/react';
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
import { ProductShowcase } from './ProductShowcase';

vi.mock('@/lib/api/client', () => ({ api: { GET: vi.fn() } }));

const category = { id: categoryIds.floor, name: 'Flooring' };

function Harness({
  onUnavailable,
  onChosen,
  onOpenDetail,
}: {
  onUnavailable: () => void;
  onChosen: () => void;
  onOpenDetail: (id: string) => void;
}) {
  const room = useDraft((state) => state.rooms[0]);
  return (
    <ProductShowcase
      room={room}
      category={category}
      size="desktop"
      order="server"
      onUnavailable={onUnavailable}
      onChosen={onChosen}
      onOpenDetail={onOpenDetail}
    />
  );
}

async function renderShowcase(
  options: Parameters<typeof renderWithProviders>[1] = {},
) {
  useDraft.setState({ ...makeInteriorDraft(), revision: 1 });
  const onUnavailable = vi.fn();
  const onChosen = vi.fn();
  const onOpenDetail = vi.fn();
  let result!: ReturnType<typeof renderWithProviders>;
  await act(async () => {
    result = renderWithProviders(
      <Harness
        onUnavailable={onUnavailable}
        onChosen={onChosen}
        onOpenDetail={onOpenDetail}
      />,
      options,
    );
  });
  return {
    ...result,
    onUnavailable,
    onChosen,
    onOpenDetail,
    slot: result.container,
  };
}

function cards(root: HTMLElement) {
  return within(root).getAllByRole('listitem');
}

function cardNamed(root: HTMLElement, name: string) {
  const found = cards(root).find((card) => card.textContent?.includes(name));
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

describe('ProductShowcase', () => {
  beforeEach(() => {
    installMemoryStorage();
    clearEstimateCache();
    clearCardCostCache();
    resetWarmup();
    vi.mocked(api.GET).mockReset();
  });

  it('renders cards in the showcase zone with unit price, room cost and the picked marker', async () => {
    const { slot } = await renderShowcase();

    const laminate = cardNamed(slot, 'Oak Natural Laminate');
    expect(chooseButton(slot, 'Oak Natural Laminate')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(laminate).toHaveTextContent('$18');
    expect(laminate).toHaveTextContent(en.ProductShowcase.forRoom);
    expect(laminate).toHaveTextContent(en.ProductShowcase.picked);
    expect(chooseButton(slot, 'Stone Grey Porcelain Tile')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('selects a product with one click and reports it', async () => {
    const { slot, onChosen, onOpenDetail } = await renderShowcase();

    await act(async () => {
      fireEvent.click(chooseButton(slot, 'Stone Grey Porcelain Tile'));
    });

    expect(useDraft.getState().rooms[0].selections[categoryIds.floor]).toEqual({
      productId: productIds.tile,
      disabled: false,
      source: 'manual',
    });
    expect(onChosen).toHaveBeenCalledTimes(1);
    expect(onOpenDetail).not.toHaveBeenCalled();
    expect(chooseButton(slot, 'Stone Grey Porcelain Tile')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('opens the detail without changing the selection', async () => {
    const { slot, onChosen, onOpenDetail } = await renderShowcase();

    await act(async () => {
      fireEvent.click(
        within(slot).getByRole('button', {
          name: 'Details: Stone Grey Porcelain Tile',
        }),
      );
    });

    expect(onOpenDetail).toHaveBeenCalledWith(productIds.tile);
    expect(onChosen).not.toHaveBeenCalled();
    expect(
      useDraft.getState().rooms[0].selections[categoryIds.floor]?.productId,
    ).toBe(productIds.laminate);
  });

  it('shows the hint and re-enables an excluded category on choose', async () => {
    const { slot } = await renderShowcase();
    await act(async () => {
      useDraft
        .getState()
        .disableCategory(
          useDraft.getState().rooms[0].clientId,
          categoryIds.floor,
        );
    });

    expect(
      within(slot).getByText(en.ProductShowcase.excluded),
    ).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(chooseButton(slot, 'Stone Grey Porcelain Tile'));
    });

    expect(useDraft.getState().rooms[0].selections[categoryIds.floor]).toEqual({
      productId: productIds.tile,
      disabled: false,
      source: 'manual',
    });
    expect(
      within(slot).queryByText(en.ProductShowcase.excluded),
    ).not.toBeInTheDocument();
  });

  it('reports an unavailable category when the catalog answers 404', async () => {
    useWarmup.setState({ server: 'ready' });
    vi.mocked(api.GET).mockResolvedValue({
      data: undefined,
      error: { error: { code: 'NOT_FOUND' } },
      response: { status: 404 },
    } as never);
    const { onUnavailable } = await renderShowcase({
      catalog: false,
      queryClient: createTestQueryClient(),
    });

    await vi.waitFor(() => expect(onUnavailable).toHaveBeenCalled());
  });

  it.each(forEachLocale)('has no axe violations in %s', async (locale) => {
    const { slot } = await renderShowcase({ locale });

    expect(await axe(slot)).toHaveNoViolations();
  });
});
