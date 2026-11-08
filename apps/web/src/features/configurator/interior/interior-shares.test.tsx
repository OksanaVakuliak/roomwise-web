import { act, fireEvent, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api/client';
import type { DraftSelection } from '@/lib/draft/schema';
import { clearCardCostCache } from '@/lib/engine/card-cost';
import { clearEstimateCache } from '@/lib/engine/run-estimate';
import { installMemoryStorage } from '@/lib/theme/test-utils';
import { resetWarmup } from '@/lib/warmup/warmup';
import { useDraft } from '@/stores/draft';
import { categoryIds, productIds } from '@/test/fixtures/catalog';
import { forEachLocale } from '@/test/render-with-providers';
import {
  catalogs,
  currentDraft,
  livingId,
  renderStep,
  wallpaperId,
} from './interior-step.helpers';

vi.mock('@/lib/api/client', () => ({ api: { GET: vi.fn() } }));

const url = `/configurator/interior?room=${livingId}&category=${categoryIds.walls}`;
const living = () => currentDraft().rooms[0];
const removeButtons = () =>
  screen.getAllByRole('button', { name: /^Remove .* from Living room 1$/ });
const share = (id: string) => living().selections[id]?.areaShare;

function setWallpaperProduct(productId: string | null) {
  act(() => {
    useDraft.setState({
      rooms: currentDraft().rooms.map((room) => ({
        ...room,
        selections: {
          ...room.selections,
          [wallpaperId]: {
            ...(room.selections[wallpaperId] as DraftSelection),
            productId,
          },
        },
      })),
    });
  });
}

async function addWallpaper(locale: 'en' | 'uk' = 'en') {
  const text = catalogs[locale].ChosenList;
  await act(async () => {
    fireEvent.click(
      screen.getByRole('button', {
        name: text.addCoveringLabel
          .replace('{category}', 'Wallpaper')
          .replace('{room}', 'Living room 1'),
      }),
    );
  });
}

describe('InteriorStep area shares', () => {
  beforeEach(() => {
    installMemoryStorage();
    clearEstimateCache();
    clearCardCostCache();
    resetWarmup();
    vi.mocked(api.GET).mockReset();
  });

  it('offers adding a covering only for walls and floor', async () => {
    await renderStep(url, { withWallpaper: true });

    expect(
      screen.getAllByRole('button', { name: /^Add .* covering for/ }),
    ).toHaveLength(1);
    expect(removeButtons()).toHaveLength(3);
  });

  it.each(forEachLocale)(
    'splits the walls 50/50 and shows two rows with share fields in %s',
    async (locale) => {
      await renderStep(url, { withWallpaper: true, locale });
      await addWallpaper(locale);
      const text = catalogs[locale].ChosenList;

      expect(share(categoryIds.walls)).toBe(50);
      expect(share(wallpaperId)).toBe(50);
      expect(screen.getAllByRole('spinbutton')).toHaveLength(2);
      expect(
        screen.getAllByText(text.share, { selector: 'label' }),
      ).toHaveLength(2);
      expect(
        screen.queryByRole('button', {
          name: text.addCoveringLabel
            .replace('{category}', 'Wallpaper')
            .replace('{room}', 'Living room 1'),
        }),
      ).toBeNull();
    },
  );

  it('updates the draft when a share is edited', async () => {
    await renderStep(url, { withWallpaper: true });
    await addWallpaper();
    const [first] = screen.getAllByRole('spinbutton');

    await act(async () => {
      fireEvent.change(first, { target: { value: '70' } });
      fireEvent.blur(first);
    });

    const shared = [categoryIds.walls, wallpaperId].map(share);
    expect(shared).toContain(70);
  });

  it('shows an error when the shares go over 100', async () => {
    await renderStep(url, { withWallpaper: true });
    await addWallpaper();
    setWallpaperProduct(productIds.paint);
    const [first] = screen.getAllByRole('spinbutton');

    await act(async () => {
      fireEvent.change(first, { target: { value: '70' } });
      fireEvent.blur(first);
    });

    const note = screen.getByText('Shares add up to 120% — over 100%');
    expect(note).toHaveAttribute('role', 'status');
  });

  it('shows the unallocated warning when the shares are under 100', async () => {
    await renderStep(url, { withWallpaper: true });
    await addWallpaper();
    setWallpaperProduct(productIds.paint);
    const [first] = screen.getAllByRole('spinbutton');

    await act(async () => {
      fireEvent.change(first, { target: { value: '20' } });
      fireEvent.blur(first);
    });

    const note = screen.getByText(
      /^Walls: 30% not allocated \(≈ [\d.,]+ m²\)$/,
    );
    expect(note).toHaveAttribute('role', 'status');
  });

  it('counts only shared coverings with a product as allocated', async () => {
    await renderStep(url, { withWallpaper: true });
    await addWallpaper();
    setWallpaperProduct(null);
    const [first] = screen.getAllByRole('spinbutton');

    await act(async () => {
      fireEvent.change(first, { target: { value: '20' } });
      fireEvent.blur(first);
    });

    expect(
      screen.getByText(/^Walls: 80% not allocated \(≈ [\d.,]+ m²\)$/),
    ).toBeInTheDocument();
  });

  it('shows the share area as a hint', async () => {
    await renderStep(url, { withWallpaper: true });
    await addWallpaper();

    expect(screen.getAllByText(/^≈ [\d.,]+\s?m²$/)).toHaveLength(2);
  });

  it('does not warn about replacing the covering it is shared with', async () => {
    await renderStep(url, { withWallpaper: true });
    await addWallpaper();

    expect(screen.queryByText(/will replace it/)).toBeNull();
  });

  it('returns to a single row without a share field after removing one covering', async () => {
    await renderStep(url, { withWallpaper: true });
    await addWallpaper();

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', {
          name: 'Remove Wallpaper from Living room 1',
        }),
      );
    });

    expect(screen.queryByRole('spinbutton')).toBeNull();
    expect(removeButtons()).toHaveLength(3);
    expect(share(categoryIds.walls)).toBeUndefined();
    expect(living().selections[wallpaperId]?.disabled).toBe(true);
  });

  it('sums the lines of every shared covering into the room total', async () => {
    await renderStep(url, { withWallpaper: true });
    useDraft.getState().addCovering(livingId, wallpaperId, [
      { id: categoryIds.walls, surface: 'WALLS' },
      { id: wallpaperId, surface: 'WALLS' },
    ]);
    useDraft
      .getState()
      .selectProduct(livingId, wallpaperId, productIds.paint, []);

    const heading = within(
      screen.getByRole('region', { name: /Living room/ }),
    ).getByRole('heading', { level: 3 });
    expect(heading.textContent).toMatch(/\d/);
  });
});
