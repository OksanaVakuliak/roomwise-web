import type { components } from '@/generated/api';
import type { DraftSelection } from '@/lib/draft/schema';
import type { SurfaceCategory } from '@/lib/draft/surfaces';
import type { SceneMaterial, SurfaceKey } from './types';

type ProductDetails =
  components['schemas']['PublicProductDetailsResponseDto_Output'];

export type SurfaceProduct = Pick<
  ProductDetails,
  'id' | 'name' | 'surface' | 'surfaceColor'
>;

export type SurfaceMaterials = Record<SurfaceKey, SceneMaterial>;

type Selections = Record<string, DraftSelection>;

const SURFACE_OF_KEY: Record<SurfaceKey, string> = {
  floor: 'FLOOR',
  walls: 'WALLS',
  ceiling: 'CEILING',
};

export const SURFACE_KEYS = Object.keys(SURFACE_OF_KEY) as SurfaceKey[];

type Picked = { productId: string; share: number };

function categoriesOf(
  categories: readonly SurfaceCategory[],
  key: SurfaceKey,
): SurfaceCategory[] {
  return categories.filter(
    (category) => category.surface === SURFACE_OF_KEY[key],
  );
}

function pickPrimary(
  selections: Selections,
  categories: readonly SurfaceCategory[],
): Picked | 'disabled' | 'unselected' {
  let primary: Picked | null = null;
  let anyDisabled = false;
  let anyEnabledEmpty = false;
  for (const category of categories) {
    const selection = selections[category.id];
    if (!selection) {
      continue;
    }
    if (selection.disabled) {
      anyDisabled = true;
      continue;
    }
    if (selection.productId === null) {
      anyEnabledEmpty = true;
      continue;
    }
    const share = selection.areaShare ?? 0;
    if (primary === null || share > primary.share) {
      primary = { productId: selection.productId, share };
    }
  }
  if (primary) {
    return primary;
  }
  return anyDisabled && !anyEnabledEmpty ? 'disabled' : 'unselected';
}

function toMaterial(product: SurfaceProduct): SceneMaterial {
  const { surface } = product;
  if (!surface) {
    return {
      kind: 'color',
      productId: product.id,
      name: product.name,
      color: product.surfaceColor,
    };
  }
  const { realSizeMm } = surface.texture;
  return {
    kind: 'texture',
    productId: product.id,
    name: product.name,
    color: surface.fallbackColor,
    textureUrl: surface.texture.url,
    previewUrl: surface.texture.previewUrl,
    textureStepMm:
      realSizeMm === null
        ? { widthMm: surface.tileWidthMm, lengthMm: surface.tileLengthMm }
        : { widthMm: realSizeMm, lengthMm: realSizeMm },
  };
}

export function surfaceProductIds(
  selections: Selections,
  categories: readonly SurfaceCategory[],
): string[] {
  const ids = new Set<string>();
  for (const key of SURFACE_KEYS) {
    const picked = pickPrimary(selections, categoriesOf(categories, key));
    if (typeof picked === 'object') {
      ids.add(picked.productId);
    }
  }
  return [...ids];
}

export function resolveSceneMaterials(
  selections: Selections,
  categories: readonly SurfaceCategory[],
  products: ReadonlyMap<string, SurfaceProduct>,
): SurfaceMaterials {
  const resolve = (key: SurfaceKey): SceneMaterial => {
    const picked = pickPrimary(selections, categoriesOf(categories, key));
    if (typeof picked === 'string') {
      return { kind: 'neutral', reason: picked };
    }
    const product = products.get(picked.productId);
    return product
      ? toMaterial(product)
      : { kind: 'neutral', reason: 'unselected' };
  };
  return {
    floor: resolve('floor'),
    walls: resolve('walls'),
    ceiling: resolve('ceiling'),
  };
}
