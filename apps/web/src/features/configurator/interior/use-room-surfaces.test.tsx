import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { SurfaceMaterials } from '@/lib/room-3d/materials';
import {
  categoryIds,
  makeProductDetails,
  makeRoomTypes,
  makeSurfaceProducts,
  productIds,
} from '@/test/fixtures/catalog';
import { makeDraftRoom } from '@/test/fixtures/draft';
import {
  createTestQueryClient,
  renderWithProviders,
  seedCatalog,
} from '@/test/render-with-providers';
import { toSceneSurfaces, useRoomSurfaces } from './use-room-surfaces';

type DraftRoom = ReturnType<typeof makeDraftRoom>;

function Probe({ room }: { room: DraftRoom }) {
  const materials = useRoomSurfaces(room);
  return (
    <>
      <output data-testid="materials">{JSON.stringify(materials)}</output>
      <output data-testid="scene">
        {JSON.stringify(toSceneSurfaces(materials))}
      </output>
    </>
  );
}

function selection(productId: string | null, disabled = false) {
  return { productId, disabled, source: 'manual' as const };
}

function renderProbe(room: DraftRoom, extraFloorCategory = false) {
  const queryClient = createTestQueryClient();
  seedCatalog(queryClient, 'en');
  if (extraFloorCategory) {
    queryClient.setQueryData(['room-types', 'en'], {
      items: makeRoomTypes().items.map((item) => ({
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
  const fixtures = makeSurfaceProducts();
  for (const product of Object.values(fixtures)) {
    queryClient.setQueryData(['product', product.id, 'en'], product);
  }
  queryClient.setQueryData(
    ['product', productIds.laminate, 'en'],
    makeProductDetails(productIds.laminate, {
      surface: null,
      surfaceColor: null,
    }),
  );
  renderWithProviders(<Probe room={room} />, { queryClient, catalog: false });
  return {
    materials: JSON.parse(
      screen.getByTestId('materials').textContent ?? '{}',
    ) as SurfaceMaterials,
    scene: JSON.parse(screen.getByTestId('scene').textContent ?? '{}'),
  };
}

describe('useRoomSurfaces', () => {
  it('returns floor, walls and ceiling materials', () => {
    const { materials } = renderProbe(
      makeDraftRoom({
        selections: {
          [categoryIds.floor]: selection(productIds.tile),
          [categoryIds.walls]: selection(productIds.paint),
          [categoryIds.ceiling]: selection(productIds.ceilingPaint),
        },
      }),
    );
    expect(materials.floor).toMatchObject({
      kind: 'texture',
      productId: productIds.tile,
      textureStepMm: { widthMm: 1500, lengthMm: 1500 },
    });
    expect(materials.walls).toMatchObject({
      kind: 'texture',
      textureStepMm: { widthMm: 1000, lengthMm: 1000 },
    });
    expect(materials.ceiling).toMatchObject({
      kind: 'texture',
      productId: productIds.ceilingPaint,
      color: '#ffffff',
    });
  });

  it('marks disabled and unselected surfaces as neutral', () => {
    const { materials } = renderProbe(
      makeDraftRoom({
        selections: {
          [categoryIds.floor]: selection(productIds.tile, true),
        },
      }),
    );
    expect(materials).toEqual({
      floor: { kind: 'neutral', reason: 'disabled' },
      walls: { kind: 'neutral', reason: 'unselected' },
      ceiling: { kind: 'neutral', reason: 'unselected' },
    });
  });

  it('keeps a product without a surface as a color material', () => {
    const { materials } = renderProbe(
      makeDraftRoom({
        selections: {
          [categoryIds.walls]: selection(productIds.laminatePremium),
          [categoryIds.ceiling]: selection(productIds.laminate),
        },
      }),
    );
    expect(materials.walls).toMatchObject({ kind: 'color', color: '#6b4a2f' });
    expect(materials.ceiling).toMatchObject({ kind: 'color', color: null });
  });

  it('lets the first enabled category of a surface win', () => {
    const { materials } = renderProbe(
      makeDraftRoom({
        selections: {
          [categoryIds.floor]: selection(productIds.laminatePremium),
          'cat-tile': selection(productIds.tile),
        },
      }),
      true,
    );
    expect(materials.floor).toMatchObject({
      productId: productIds.laminatePremium,
    });
  });

  it('falls through to the next category when the first is disabled', () => {
    const { materials } = renderProbe(
      makeDraftRoom({
        selections: {
          [categoryIds.floor]: selection(productIds.laminate, true),
          'cat-tile': selection(productIds.tile),
        },
      }),
      true,
    );
    expect(materials.floor).toMatchObject({ productId: productIds.tile });
  });
});

describe('toSceneSurfaces', () => {
  it('exposes only textured floor and walls to the placeholder scene', () => {
    const { scene } = renderProbe(
      makeDraftRoom({
        selections: {
          [categoryIds.floor]: selection(productIds.tile),
          [categoryIds.walls]: selection(productIds.laminatePremium),
          [categoryIds.ceiling]: selection(productIds.ceilingPaint),
        },
      }),
    );
    expect(scene).toEqual({
      floor: {
        textureUrl: 'https://cdn.test/textures/floor-tile.jpg',
        tileWidthMm: 1500,
        tileLengthMm: 1500,
        fallbackColor: '#9a9a9a',
      },
    });
  });
});
