import type { components } from '@/generated/api';
import { adminIds, makeAdminImageRef, makeStamp } from './ids';

type Schemas = components['schemas'];

export type AdminProduct = Schemas['ProductAdminDto_Output'];
export type AdminProductsResponse =
  Schemas['ProductAdminListResponseDto_Output'];
export type AdminProductRow = AdminProductsResponse['items'][number];

export function makeAdminProduct(
  overrides: Partial<AdminProduct> = {},
): AdminProduct {
  const imageId = adminIds.images.laminate;
  return {
    id: adminIds.products.laminate,
    categoryId: adminIds.categories.flooring,
    materialTypeId: adminIds.materialTypes.laminate,
    name: { en: 'Oak Natural Laminate', uk: 'Ламінат Дуб натуральний' },
    description: {
      en: 'Water-resistant 8 mm laminate with an oak finish.',
      uk: 'Вологостійкий ламінат 8 мм з оздобленням під дуб.',
    },
    brand: 'Roomwise',
    manufacturer: 'Roomwise Factory',
    color: { en: 'Natural', uk: 'Натуральний' },
    size: { en: '1200x190 mm', uk: '1200x190 мм' },
    priceCents: 2450,
    unit: 'SQM',
    wastePercentOverride: null,
    heatedFloorCompatible: true,
    images: [
      {
        ...makeAdminImageRef(imageId),
        isPrimary: true,
      },
    ],
    attributes: [
      {
        name: { en: 'Thickness', uk: 'Товщина' },
        value: { en: '8 mm', uk: '8 мм' },
      },
    ],
    tileWidthMm: null,
    tileLengthMm: null,
    fallbackColor: null,
    texture: null,
    status: 'PUBLISHED',
    ...makeStamp(),
    ...overrides,
  };
}

export function makeDraftProductWithoutUk(
  overrides: Partial<AdminProduct> = {},
): AdminProduct {
  return makeAdminProduct({
    id: adminIds.products.draftTile,
    categoryId: adminIds.categories.wallFinish,
    materialTypeId: adminIds.materialTypes.tile,
    name: { en: 'Matte White Tile', uk: '' },
    description: { en: 'Matte ceramic wall tile.', uk: '' },
    color: { en: 'White', uk: '' },
    size: { en: '300x600 mm', uk: '' },
    priceCents: 0,
    images: [],
    attributes: [],
    heatedFloorCompatible: false,
    status: 'DRAFT',
    ...overrides,
  });
}

export function makeTexturedProduct(
  overrides: Partial<AdminProduct> = {},
): AdminProduct {
  const textureId = adminIds.images.texture;
  return makeAdminProduct({
    id: adminIds.products.textured,
    categoryId: adminIds.categories.flooring,
    materialTypeId: adminIds.materialTypes.tile,
    name: { en: 'Graphite Floor Tile', uk: 'Підлогова плитка Графіт' },
    description: {
      en: 'Porcelain floor tile in graphite.',
      uk: 'Керамограніт для підлоги кольору графіт.',
    },
    color: { en: 'Graphite', uk: 'Графіт' },
    size: { en: '600x600 mm', uk: '600x600 мм' },
    priceCents: 3190,
    tileWidthMm: 600,
    tileLengthMm: 600,
    fallbackColor: '#3b3f45',
    texture: {
      id: textureId,
      url: `https://res.cloudinary.example.com/roomwise/${textureId}/texture.webp`,
      previewUrl: `https://res.cloudinary.example.com/roomwise/${textureId}/preview.webp`,
      realSizeMm: 600,
    },
    ...overrides,
  });
}

export function makeArchivedProduct(
  overrides: Partial<AdminProduct> = {},
): AdminProduct {
  return makeAdminProduct({
    id: adminIds.products.archived,
    categoryId: adminIds.categories.legacyDecor,
    name: { en: 'Retired Decor Panel', uk: 'Знятий з виробництва панель' },
    priceCents: 1200,
    unit: 'PIECE',
    status: 'ARCHIVED',
    ...overrides,
  });
}

export function makeProductInStyle(
  overrides: Partial<AdminProduct> = {},
): AdminProduct {
  return makeAdminProduct({
    id: adminIds.products.inStyle,
    categoryId: adminIds.categories.wallFinish,
    materialTypeId: adminIds.materialTypes.paint,
    name: { en: 'Silk Matt Paint', uk: 'Шовковисто-матова фарба' },
    priceCents: 1890,
    ...overrides,
  });
}

export function makeAdminProductRow(
  product: AdminProduct = makeAdminProduct(),
): AdminProductRow {
  const primary = product.images.find((image) => image.isPrimary);
  return {
    id: product.id,
    name: product.name,
    categoryId: product.categoryId,
    status: product.status,
    priceCents: product.priceCents,
    unit: product.unit,
    image: primary
      ? {
          id: primary.id,
          thumb: primary.thumb,
          card: primary.card,
          zoom: primary.zoom,
        }
      : null,
    updatedAt: product.updatedAt,
    updatedBy: product.updatedBy,
  };
}

export function makeAdminProducts(): AdminProductsResponse {
  const items = [
    makeAdminProduct(),
    makeDraftProductWithoutUk(),
    makeTexturedProduct(),
    makeArchivedProduct(),
    makeProductInStyle(),
  ].map(makeAdminProductRow);
  return { items, page: 1, pageSize: 20, total: items.length };
}
