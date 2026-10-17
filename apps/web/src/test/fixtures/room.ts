import type { components } from '@/generated/api';

type RoomTypes = components['schemas']['PublicRoomTypesResponseDto_Output'];
export type RoomType = RoomTypes['items'][number];
export type Category = RoomType['categories'][number];

export function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: '00000000-0000-4000-8000-000000000101',
    name: 'Flooring',
    surface: 'FLOOR',
    wastePercent: 10,
    productCount: 3,
    ...overrides,
  };
}

export function makeRoomType(overrides: Partial<RoomType> = {}): RoomType {
  return {
    id: '00000000-0000-4000-8000-000000000201',
    code: 'LIVING_ROOM',
    name: 'Living room',
    categories: [makeCategory()],
    ...overrides,
  };
}

export type RoomDimensions = {
  lengthMm: number;
  widthMm: number;
  heightMm: number;
};

export function makeRoomDimensions(
  overrides: Partial<RoomDimensions> = {},
): RoomDimensions {
  return { lengthMm: 5000, widthMm: 4000, heightMm: 2700, ...overrides };
}
