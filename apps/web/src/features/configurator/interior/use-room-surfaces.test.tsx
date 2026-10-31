import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { SceneSurfaces } from '@/components/ui';
import {
  categoryIds,
  makeProductDetails,
  makeRoomTypes,
  productIds,
} from '@/test/fixtures/catalog';
import { makeDraftRoom } from '@/test/fixtures/draft';
import {
  createTestQueryClient,
  renderWithProviders,
  seedCatalog,
} from '@/test/render-with-providers';
import { useRoomSurfaces } from './use-room-surfaces';

type DraftRoom = ReturnType<typeof makeDraftRoom>;

function surface(color: string) {
  return {
    kind: 'FLOOR' as const,
    texture: { id: 't', url: `https://cdn.test/${color}.jpg` },
    tileWidthMm: 190,
    tileLengthMm: 1200,
    fallbackColor: color,
  };
}

function Probe({ room }: { room: DraftRoom }) {
  const surfaces: SceneSurfaces = useRoomSurfaces(room);
  return <output data-testid="out">{JSON.stringify(surfaces)}</output>;
}

function selection(productId: string, disabled = false) {
  return { productId, disabled, source: 'manual' as const };
}

function renderProbe(room: DraftRoom, extraFloorCategory = false) {
  const queryClient = createTestQueryClient();
  seedCatalog(queryClient, 'en');
  const types = makeRoomTypes();
  if (extraFloorCategory) {
    queryClient.setQueryData(['room-types', 'en'], {
      items: types.items.map((item) => ({
        ...item,
        categories: [
          ...item.categories,
          {
            id: 'cat-tile',
            name: 'Tile',
            surface: 'FLOOR' as const,
            wastePercent: 5,
            productCount: 1,
          },
        ],
      })),
    });
  }
  queryClient.setQueryData(
    ['product', productIds.laminate, 'en'],
    makeProductDetails(productIds.laminate, { surface: surface('#aa0000') }),
  );
  queryClient.setQueryData(
    ['product', productIds.tile, 'en'],
    makeProductDetails(productIds.tile, { surface: surface('#00aa00') }),
  );
  renderWithProviders(<Probe room={room} />, { queryClient, catalog: false });
  return JSON.parse(screen.getByTestId('out').textContent ?? '{}');
}

describe('useRoomSurfaces', () => {
  it('maps each surface category to the selected product texture', () => {
    const result = renderProbe(
      makeDraftRoom({
        selections: { [categoryIds.floor]: selection(productIds.laminate) },
      }),
    );
    expect(result).toEqual({
      floor: {
        textureUrl: 'https://cdn.test/#aa0000.jpg',
        tileWidthMm: 190,
        tileLengthMm: 1200,
        fallbackColor: '#aa0000',
      },
    });
  });

  it('ignores disabled categories and products without a surface', () => {
    const result = renderProbe(
      makeDraftRoom({
        selections: {
          [categoryIds.floor]: selection(productIds.laminate, true),
          [categoryIds.walls]: selection(productIds.paint),
        },
      }),
    );
    expect(result).toEqual({});
  });

  it('lets the first enabled category of a surface win', () => {
    const result = renderProbe(
      makeDraftRoom({
        selections: {
          [categoryIds.floor]: selection(productIds.laminate),
          'cat-tile': selection(productIds.tile),
        },
      }),
      true,
    );
    expect(result.floor.fallbackColor).toBe('#aa0000');
  });

  it('falls through to the next category when the first is disabled', () => {
    const result = renderProbe(
      makeDraftRoom({
        selections: {
          [categoryIds.floor]: selection(productIds.laminate, true),
          'cat-tile': selection(productIds.tile),
        },
      }),
      true,
    );
    expect(result.floor.fallbackColor).toBe('#00aa00');
  });
});
