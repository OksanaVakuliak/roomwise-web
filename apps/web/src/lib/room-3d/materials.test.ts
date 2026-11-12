import { describe, expect, it } from 'vitest';
import type { DraftSelection } from '@/lib/draft/schema';
import type { SurfaceCategory } from '@/lib/draft/surfaces';
import {
  categoryIds,
  makeSurface,
  makeSurfaceProducts,
  productIds,
} from '@/test/fixtures/catalog';
import {
  resolveSceneMaterials,
  type SurfaceProduct,
  surfaceProductIds,
} from './materials';

const categories: SurfaceCategory[] = [
  { id: categoryIds.floor, surface: 'FLOOR' },
  { id: 'cat-tile', surface: 'FLOOR' },
  { id: categoryIds.walls, surface: 'WALLS' },
  { id: categoryIds.ceiling, surface: 'CEILING' },
  { id: 'cat-misc', surface: 'NONE' },
];

const fixtures = makeSurfaceProducts();

function productMap(...items: SurfaceProduct[]) {
  return new Map(items.map((item) => [item.id, item]));
}

function pick(
  productId: string | null,
  extra: Partial<DraftSelection> = {},
): DraftSelection {
  return { productId, disabled: false, source: 'manual', ...extra };
}

describe('resolveSceneMaterials', () => {
  it('builds texture materials with the real size as a square step', () => {
    const result = resolveSceneMaterials(
      { [categoryIds.floor]: pick(productIds.tile) },
      categories,
      productMap(fixtures.floorTile),
    );
    expect(result.floor).toEqual({
      kind: 'texture',
      productId: productIds.tile,
      name: fixtures.floorTile.name,
      color: '#9a9a9a',
      textureUrl: 'https://cdn.test/textures/floor-tile.jpg',
      previewUrl: 'https://cdn.test/textures/floor-tile-512.jpg',
      textureStepMm: { widthMm: 1500, lengthMm: 1500 },
    });
  });

  it('falls back to the product module when the real size is unknown', () => {
    const result = resolveSceneMaterials(
      { [categoryIds.walls]: pick(productIds.paint) },
      categories,
      productMap(fixtures.wallPaint),
    );
    expect(result.walls).toMatchObject({
      kind: 'texture',
      color: '#f2efe9',
      textureStepMm: { widthMm: 1000, lengthMm: 1000 },
    });
  });

  it('keeps a non-square module for textures without a real size', () => {
    const product = {
      ...fixtures.floorTile,
      surface: makeSurface({
        texture: { ...makeSurface().texture, realSizeMm: null },
        tileWidthMm: 190,
        tileLengthMm: 1200,
      }),
    };
    const result = resolveSceneMaterials(
      { [categoryIds.floor]: pick(productIds.tile) },
      categories,
      productMap(product),
    );
    expect(result.floor).toMatchObject({
      textureStepMm: { widthMm: 190, lengthMm: 1200 },
    });
  });

  it('resolves the ceiling like any other surface', () => {
    const result = resolveSceneMaterials(
      { [categoryIds.ceiling]: pick(productIds.ceilingPaint) },
      categories,
      productMap(fixtures.ceiling),
    );
    expect(result.ceiling).toMatchObject({ kind: 'texture', color: '#ffffff' });
  });

  it('marks disabled categories as neutral and disabled', () => {
    const result = resolveSceneMaterials(
      {
        [categoryIds.floor]: pick(productIds.laminate, { disabled: true }),
        'cat-tile': pick(productIds.tile, { disabled: true }),
      },
      categories,
      productMap(fixtures.floorTile),
    );
    expect(result.floor).toEqual({ kind: 'neutral', reason: 'disabled' });
  });

  it('treats a category without a selection as enabled but empty', () => {
    const result = resolveSceneMaterials(
      { 'cat-tile': pick(productIds.tile, { disabled: true }) },
      categories,
      productMap(fixtures.floorTile),
    );
    expect(result.floor).toEqual({ kind: 'neutral', reason: 'unselected' });
  });

  it('marks missing selections and empty products as unselected', () => {
    const result = resolveSceneMaterials(
      { [categoryIds.walls]: pick(null) },
      categories,
      productMap(),
    );
    expect(result).toEqual({
      floor: { kind: 'neutral', reason: 'unselected' },
      walls: { kind: 'neutral', reason: 'unselected' },
      ceiling: { kind: 'neutral', reason: 'unselected' },
    });
  });

  it('is unselected while product details are not loaded', () => {
    const result = resolveSceneMaterials(
      { [categoryIds.floor]: pick(productIds.tile) },
      categories,
      productMap(),
    );
    expect(result.floor).toEqual({ kind: 'neutral', reason: 'unselected' });
  });

  it('uses the surface color for a product without a surface', () => {
    const result = resolveSceneMaterials(
      { [categoryIds.walls]: pick(productIds.laminatePremium) },
      categories,
      productMap(fixtures.colorOnly),
    );
    expect(result.walls).toEqual({
      kind: 'color',
      productId: productIds.laminatePremium,
      name: fixtures.colorOnly.name,
      color: '#6b4a2f',
    });
  });

  it('keeps the product name with a null color when there is no color', () => {
    const result = resolveSceneMaterials(
      { [categoryIds.walls]: pick(productIds.laminate) },
      categories,
      productMap(fixtures.bare),
    );
    expect(result.walls).toEqual({
      kind: 'color',
      productId: productIds.laminate,
      name: fixtures.bare.name,
      color: null,
    });
  });

  it('picks the largest area share and the first on a tie', () => {
    const products = productMap(fixtures.floorTile, fixtures.bare);
    const larger = resolveSceneMaterials(
      {
        [categoryIds.floor]: pick(productIds.laminate, { areaShare: 30 }),
        'cat-tile': pick(productIds.tile, { areaShare: 70 }),
      },
      categories,
      products,
    );
    expect(larger.floor).toMatchObject({ productId: productIds.tile });
    const tie = resolveSceneMaterials(
      {
        [categoryIds.floor]: pick(productIds.laminate, { areaShare: 50 }),
        'cat-tile': pick(productIds.tile, { areaShare: 50 }),
      },
      categories,
      products,
    );
    expect(tie.floor).toMatchObject({ productId: productIds.laminate });
  });

  it('skips a disabled category when another one is enabled', () => {
    const result = resolveSceneMaterials(
      {
        [categoryIds.floor]: pick(productIds.laminate, { disabled: true }),
        'cat-tile': pick(productIds.tile),
      },
      categories,
      productMap(fixtures.floorTile),
    );
    expect(result.floor).toMatchObject({ productId: productIds.tile });
  });

  it('binds by surface, not by category name or id', () => {
    const renamed: SurfaceCategory[] = [{ id: 'anything', surface: 'CEILING' }];
    const result = resolveSceneMaterials(
      { anything: pick(productIds.ceilingPaint) },
      renamed,
      productMap(fixtures.ceiling),
    );
    expect(result.ceiling).toMatchObject({ kind: 'texture' });
    expect(result.floor).toEqual({ kind: 'neutral', reason: 'unselected' });
  });
});

describe('surfaceProductIds', () => {
  it('lists only the products that win a surface', () => {
    expect(
      surfaceProductIds(
        {
          [categoryIds.floor]: pick(productIds.laminate, { areaShare: 20 }),
          'cat-tile': pick(productIds.tile, { areaShare: 80 }),
          [categoryIds.walls]: pick(productIds.paint, { disabled: true }),
          [categoryIds.ceiling]: pick(productIds.ceilingPaint),
        },
        categories,
      ),
    ).toEqual([productIds.tile, productIds.ceilingPaint]);
  });
});
