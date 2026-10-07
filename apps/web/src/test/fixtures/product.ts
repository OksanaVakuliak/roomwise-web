import type { components } from '@/generated/api';

export type Product =
  components['schemas']['PublicProductCardsResponseDto_Output']['items'][number];

export function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    name: 'Oak Natural Laminate',
    brand: 'Roomwise',
    manufacturer: 'Roomwise Factory',
    size: '1200x190 mm',
    color: 'Natural',
    priceCents: 2450,
    unit: 'SQM',
    materialTypeCode: 'LAMINATE',
    heatedFloorCompatible: false,
    image: null,
    ...overrides,
  };
}
