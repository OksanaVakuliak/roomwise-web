import type { components } from '@/generated/api';
import { makePricingData } from './pricing-data';

type Schemas = components['schemas'];

export type StylesResponse = Schemas['PublicStylesResponseDto_Output'];
export type Style = StylesResponse['items'][number];
export type RoomTypesResponse = Schemas['PublicRoomTypesResponseDto_Output'];
export type ProductCardsResponse =
  Schemas['PublicProductCardsResponseDto_Output'];
export type ProductCard = ProductCardsResponse['items'][number];
export type ProductDetails = Schemas['PublicProductDetailsResponseDto_Output'];
export type DefaultMaterialsResponse =
  Schemas['PublicDefaultMaterialsResponseDto_Output'];
export type EngineeringResponse =
  Schemas['PublicEngineeringResponseDto_Output'];

export const styleIds = {
  modern: 'style-modern',
  classic: 'style-classic',
} as const;

export const categoryIds = {
  floor: 'cat-floor',
  walls: 'cat-walls',
  ceiling: 'cat-ceiling',
} as const;

export const productIds = {
  laminate: 'p-laminate',
  tile: 'p-tile',
  paint: 'p-paint',
  ceilingPaint: 'p-ceiling-paint',
  laminatePremium: 'p-laminate-premium',
  paintPremium: 'p-paint-premium',
} as const;

export const roomTypeIds = {
  LIVING_ROOM: 'rt-living',
  BEDROOM: 'rt-bedroom',
  KITCHEN: 'rt-kitchen',
  KITCHEN_LIVING: 'rt-kitchen-living',
  BATHROOM: 'rt-bathroom',
} as const;

type RoomTypeCode = keyof typeof roomTypeIds;

const roomTypeNames: Record<RoomTypeCode, string> = {
  LIVING_ROOM: 'Living room',
  BEDROOM: 'Bedroom',
  KITCHEN: 'Kitchen',
  KITCHEN_LIVING: 'Kitchen-living room',
  BATHROOM: 'Bathroom',
};

const productDisplay: Record<
  string,
  Pick<
    ProductDetails,
    | 'name'
    | 'description'
    | 'brand'
    | 'manufacturer'
    | 'size'
    | 'color'
    | 'wastePercent'
  >
> = {
  [productIds.laminate]: {
    name: 'Oak Natural Laminate',
    description: 'Water-resistant 8 mm laminate with an oak finish.',
    brand: 'Roomwise',
    manufacturer: 'Roomwise Factory',
    size: '1200x190 mm',
    color: 'Natural',
    wastePercent: 5,
  },
  [productIds.tile]: {
    name: 'Stone Grey Porcelain Tile',
    description: 'Matt porcelain tile suitable for heated floors.',
    brand: 'Ceramix',
    manufacturer: 'Ceramix Works',
    size: '600x600 mm',
    color: 'Grey',
    wastePercent: 10,
  },
  [productIds.paint]: {
    name: 'Silk White Wall Paint',
    description: 'Washable acrylic paint with a silk finish.',
    brand: 'Colora',
    manufacturer: 'Colora Paints',
    size: '10 l',
    color: 'White',
    wastePercent: 10,
  },
  [productIds.ceilingPaint]: {
    name: 'Matt Ceiling Paint',
    description: 'Matt paint for ceilings with a high opacity.',
    brand: 'Colora',
    manufacturer: 'Colora Paints',
    size: '10 l',
    color: 'White',
    wastePercent: 5,
  },
  [productIds.laminatePremium]: {
    name: 'Walnut Premium Laminate',
    description: 'Thick 12 mm laminate with a deep embossed surface.',
    brand: 'Roomwise',
    manufacturer: 'Roomwise Factory',
    size: '1380x244 mm',
    color: 'Walnut',
    wastePercent: 5,
  },
  [productIds.paintPremium]: {
    name: 'Mineral Designer Paint',
    description: 'Mineral paint with a velvet texture.',
    brand: 'Colora',
    manufacturer: 'Colora Paints',
    size: '5 l',
    color: 'Sand',
    wastePercent: 10,
  },
};

const materialTypeCodes: Record<string, string> = {
  'mt-laminate': 'laminate',
  'mt-tile': 'tile',
  'mt-paint': 'paint',
};

const categoryNames = {
  [categoryIds.floor]: 'Flooring',
  [categoryIds.walls]: 'Walls',
  [categoryIds.ceiling]: 'Ceiling',
} as const;

const categorySurfaces = {
  [categoryIds.floor]: 'FLOOR',
  [categoryIds.walls]: 'WALLS',
  [categoryIds.ceiling]: 'CEILING',
} as const;

const styleMaterials = {
  [styleIds.modern]: {
    [categoryIds.floor]: productIds.laminate,
    [categoryIds.walls]: productIds.paint,
    [categoryIds.ceiling]: productIds.ceilingPaint,
  },
  [styleIds.classic]: {
    [categoryIds.floor]: productIds.laminatePremium,
    [categoryIds.walls]: productIds.paintPremium,
    [categoryIds.ceiling]: productIds.ceilingPaint,
  },
} as const;

function findPricedProduct(productId: string) {
  const priced = makePricingData().products.find(
    (product) => product.id === productId,
  );
  if (!priced) {
    throw new Error(`Unknown product ${productId}`);
  }
  return priced;
}

export function makeStyle(overrides: Partial<Style> = {}): Style {
  return {
    id: styleIds.modern,
    name: 'Modern',
    description: 'Clean lines, light surfaces and neutral colours.',
    image: {
      id: 'img-style-modern',
      thumb: '/images/style-modern-thumb.jpg',
      card: '/images/style-modern-card.jpg',
      zoom: '/images/style-modern-zoom.jpg',
    },
    ...overrides,
  };
}

export function makeStyles(
  overrides: Partial<StylesResponse> = {},
): StylesResponse {
  return {
    items: [
      makeStyle(),
      makeStyle({
        id: styleIds.classic,
        name: 'Classic',
        description: 'Warm wood tones and traditional finishes.',
        image: null,
      }),
    ],
    ...overrides,
  };
}

export function makeRoomTypes(
  overrides: Partial<RoomTypesResponse> = {},
): RoomTypesResponse {
  const { products } = makePricingData();
  const categories = Object.values(categoryIds).map((id) => ({
    id,
    name: categoryNames[id],
    surface: categorySurfaces[id],
    wastePercent: 5,
    productCount: products.filter((product) => product.categoryId === id)
      .length,
  }));
  return {
    items: (Object.keys(roomTypeIds) as RoomTypeCode[]).map((code) => ({
      id: roomTypeIds[code],
      code,
      name: roomTypeNames[code],
      categories,
    })),
    ...overrides,
  };
}

export function makeProductCard(
  productId: string = productIds.laminate,
  overrides: Partial<ProductCard> = {},
): ProductCard {
  const priced = findPricedProduct(productId);
  const { name, brand, manufacturer, size, color } = productDisplay[productId];
  return {
    id: productId,
    name,
    brand,
    manufacturer,
    size,
    color,
    priceCents: priced.priceCents,
    unit: priced.unit,
    materialTypeCode: materialTypeCodes[priced.materialTypeId],
    heatedFloorCompatible: priced.heatedFloorCompatible,
    image: null,
    ...overrides,
  };
}

export function makeCategoryProducts(
  categoryId: string = categoryIds.floor,
): ProductCardsResponse {
  return {
    items: makePricingData()
      .products.filter((product) => product.categoryId === categoryId)
      .map((product) => makeProductCard(product.id)),
  };
}

export function makeProductDetails(
  productId: string = productIds.laminate,
  overrides: Partial<ProductDetails> = {},
): ProductDetails {
  const { categoryId } = findPricedProduct(productId);
  const { description, wastePercent } = productDisplay[productId];
  return {
    ...makeProductCard(productId),
    categoryId,
    description,
    wastePercent,
    images: [
      {
        id: `img-${productId}`,
        thumb: `/images/${productId}-thumb.jpg`,
        card: `/images/${productId}-card.jpg`,
        zoom: `/images/${productId}-zoom.jpg`,
      },
    ],
    attributes: [
      { name: 'Thickness', value: '8 mm' },
      { name: 'Class', value: '32' },
    ],
    surface: null,
    ...overrides,
  };
}

export function makeDefaultMaterials(
  styleId: string = styleIds.modern,
  overrides: Partial<DefaultMaterialsResponse> = {},
): DefaultMaterialsResponse {
  const materials =
    styleMaterials[styleId as keyof typeof styleMaterials] ??
    styleMaterials[styleIds.modern];
  return {
    styleId,
    items: (Object.keys(roomTypeIds) as RoomTypeCode[]).flatMap(
      (roomTypeCode) =>
        Object.values(categoryIds).map((categoryId) => ({
          roomTypeCode,
          categoryId,
          productId:
            roomTypeCode === 'BATHROOM' && categoryId === categoryIds.floor
              ? productIds.tile
              : materials[categoryId],
        })),
    ),
    ...overrides,
  };
}

export function makeEngineering(
  overrides: Partial<EngineeringResponse> = {},
): EngineeringResponse {
  return {
    packageItems: [
      {
        id: 'pk-wiring',
        name: 'Electrical wiring',
        description: 'Cabling, sockets and the distribution board.',
        includedInBase: true,
        priceCents: null,
        unit: null,
      },
      {
        id: 'pk-plumbing',
        name: 'Plumbing',
        description: 'Water supply and drainage lines.',
        includedInBase: true,
        priceCents: null,
        unit: null,
      },
      {
        id: 'pk-ventilation',
        name: 'Ventilation',
        description: 'Ducts and an extractor for wet rooms.',
        includedInBase: false,
        priceCents: 25000,
        unit: 'PROJECT',
      },
    ],
    options: [
      {
        id: 'opt-ac',
        kind: 'ENGINEERING',
        name: 'Air conditioner',
        description: 'Wall-mounted unit with installation.',
        image: null,
        priceCents: 45000,
        unit: 'PIECE',
        perRoom: false,
        roomTypeCodes: ['LIVING_ROOM', 'BEDROOM', 'KITCHEN'],
        minQuantity: 1,
        maxQuantity: 10,
      },
      {
        id: 'opt-heated-floor',
        kind: 'ENGINEERING',
        name: 'Heated floor',
        description: 'Electric heating mat under the floor covering.',
        image: null,
        priceCents: 8500,
        unit: 'ROOM_SQM',
        perRoom: true,
        roomTypeCodes: ['BATHROOM', 'KITCHEN'],
        minQuantity: null,
        maxQuantity: null,
      },
      {
        id: 'opt-design',
        kind: 'ADDITIONAL',
        name: 'Design project',
        description: 'Full interior design project with drawings.',
        image: null,
        priceCents: 120000,
        unit: 'PROJECT',
        perRoom: false,
        roomTypeCodes: [],
        minQuantity: null,
        maxQuantity: null,
      },
      {
        id: 'opt-smart-switches',
        kind: 'ADDITIONAL',
        name: 'Smart switches',
        description: 'Wi-Fi switches for every selected room.',
        image: null,
        priceCents: 20000,
        unit: 'ROOM',
        perRoom: true,
        roomTypeCodes: Object.keys(roomTypeIds) as RoomTypeCode[],
        minQuantity: null,
        maxQuantity: null,
      },
    ],
    ...overrides,
  };
}
