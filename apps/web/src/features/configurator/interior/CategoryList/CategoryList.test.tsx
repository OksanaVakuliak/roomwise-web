import { act, fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearEstimateCache } from '@/lib/engine/run-estimate';
import { installMemoryStorage } from '@/lib/theme/test-utils';
import { useDraft } from '@/stores/draft';
import { axe } from '@/test/axe';
import { categoryIds, makeRoomTypes } from '@/test/fixtures/catalog';
import { makeInteriorDraft } from '@/test/fixtures/draft';
import {
  forEachLocale,
  renderWithProviders,
} from '@/test/render-with-providers';
import en from '../../../../../messages/en.json';
import uk from '../../../../../messages/uk.json';
import { CategoryList } from './CategoryList';

const catalogs = { en, uk };

type HarnessProps = {
  onCategoryChange: (id: string | null) => void;
  emptyCeiling?: boolean;
  active?: string | null;
};

function Harness({
  onCategoryChange,
  emptyCeiling = false,
  active = null,
}: HarnessProps) {
  const room = useDraft((state) => state.rooms[0]);
  const categories = makeRoomTypes().items[0].categories.map((category) =>
    emptyCeiling && category.id === categoryIds.ceiling
      ? { ...category, productCount: 0 }
      : category,
  );
  return (
    <CategoryList
      room={room}
      roomName="Living room"
      categories={categories}
      activeCategoryId={active}
      onCategoryChange={onCategoryChange}
    />
  );
}

async function renderList(
  props: Omit<HarnessProps, 'onCategoryChange'> = {},
  locale: 'en' | 'uk' = 'en',
  withSelections = true,
) {
  const base = makeInteriorDraft();
  useDraft.setState({
    ...base,
    rooms: withSelections
      ? base.rooms
      : base.rooms.map((room) => ({ ...room, selections: {} })),
    revision: 1,
  });
  const onCategoryChange = vi.fn();
  let result!: ReturnType<typeof renderWithProviders>;
  await act(async () => {
    result = renderWithProviders(
      <Harness onCategoryChange={onCategoryChange} {...props} />,
      { locale },
    );
  });
  return { ...result, onCategoryChange };
}

describe('CategoryList', () => {
  beforeEach(() => {
    installMemoryStorage();
    clearEstimateCache();
  });

  it('shows the chosen product and a row sum for every category', async () => {
    await renderList();

    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText('Oak Natural Laminate')).toBeInTheDocument();
    expect(screen.getByText('Silk White Wall Paint')).toBeInTheDocument();
    expect(screen.getAllByText(/^\$[\d,.]+$/)).toHaveLength(3);
  });

  it('asks to choose a material when nothing is picked', async () => {
    await renderList({}, 'en', false);

    expect(screen.getAllByText(en.CategoryList.choose)).toHaveLength(3);
  });

  it('excludes a category and restores the product on enable', async () => {
    await renderList();
    const toggle = screen.getByRole('switch', {
      name: 'Include Flooring in the estimate',
    });

    await act(async () => {
      fireEvent.click(toggle);
    });

    expect(screen.getByText(en.CategoryList.excluded)).toBeInTheDocument();
    expect(screen.queryByText('Oak Natural Laminate')).not.toBeInTheDocument();
    expect(useDraft.getState().rooms[0].selections[categoryIds.floor]).toEqual(
      expect.objectContaining({ disabled: true, productId: 'p-laminate' }),
    );

    await act(async () => {
      fireEvent.click(toggle);
    });

    expect(screen.getByText('Oak Natural Laminate')).toBeInTheDocument();
  });

  it('keeps an empty category unselectable and out of the estimate', async () => {
    const { onCategoryChange } = await renderList({ emptyCeiling: true });

    const item = screen.getByRole('button', { name: /Ceiling/ });
    expect(item).toBeDisabled();
    expect(screen.getByText(en.CategoryList.empty)).toBeInTheDocument();
    expect(
      screen.queryByRole('switch', {
        name: 'Include Ceiling in the estimate',
      }),
    ).not.toBeInTheDocument();
    fireEvent.click(item);
    expect(onCategoryChange).not.toHaveBeenCalled();
  });

  it('reports the clicked category and marks the active one', async () => {
    const { onCategoryChange } = await renderList({
      active: categoryIds.walls,
    });

    expect(screen.getByRole('button', { name: /Walls/ })).toHaveAttribute(
      'aria-current',
      'true',
    );
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Flooring/ }));
    });

    expect(onCategoryChange).toHaveBeenCalledWith(categoryIds.floor);
  });

  it.each(forEachLocale)('has no axe violations in %s', async (locale) => {
    const { container } = await renderList({ emptyCeiling: true }, locale);

    expect(await axe(container)).toHaveNoViolations();
    expect(
      screen.getByRole('heading', {
        name: catalogs[locale].CategoryList.title,
      }),
    ).toBeInTheDocument();
  });
});
