import type { components } from '@/generated/api';
import { adminIds, type LocalizedText, makeStamp } from './ids';

type Schemas = components['schemas'];

export type AdminRoomType = Schemas['RoomTypeAdminDto_Output'];
export type AdminRoomTypesResponse =
  Schemas['RoomTypeAdminListResponseDto_Output'];
export type AdminCategory = Schemas['CategoryAdminDto_Output'];
export type AdminCategoriesResponse =
  Schemas['CategoryAdminListResponseDto_Output'];
export type AdminMaterialType = Schemas['MaterialTypeAdminDto_Output'];
export type AdminMaterialTypesResponse =
  Schemas['MaterialTypeAdminListResponseDto_Output'];

type RoomTypeCode = AdminRoomType['code'];

const roomTypeCodes: RoomTypeCode[] = [
  'LIVING_ROOM',
  'BEDROOM',
  'KITCHEN',
  'KITCHEN_LIVING',
  'BATHROOM',
  'HALLWAY',
  'STORAGE',
];

const roomTypeNames: Record<RoomTypeCode, LocalizedText> = {
  LIVING_ROOM: { en: 'Living room', uk: 'Вітальня' },
  BEDROOM: { en: 'Bedroom', uk: 'Спальня' },
  KITCHEN: { en: 'Kitchen', uk: 'Кухня' },
  KITCHEN_LIVING: { en: 'Kitchen-living room', uk: 'Кухня-вітальня' },
  BATHROOM: { en: 'Bathroom', uk: 'Санвузол' },
  HALLWAY: { en: 'Hallway', uk: 'Передпокій' },
  STORAGE: { en: 'Storage room', uk: 'Комора' },
};

export function makeAdminCategory(
  overrides: Partial<AdminCategory> = {},
): AdminCategory {
  return {
    id: adminIds.categories.flooring,
    name: { en: 'Flooring', uk: 'Підлога' },
    wastePercent: 10,
    surface: 'FLOOR',
    requiresPutty: false,
    status: 'PUBLISHED',
    productCount: 4,
    roomTypeCodes: ['LIVING_ROOM', 'BEDROOM', 'KITCHEN', 'HALLWAY'],
    ...makeStamp(),
    ...overrides,
  };
}

export function makeAdminCategories(): AdminCategoriesResponse {
  return {
    items: [
      makeAdminCategory(),
      makeAdminCategory({
        id: adminIds.categories.wallFinish,
        name: { en: 'Wall finish', uk: 'Оздоблення стін' },
        wastePercent: 8,
        surface: 'WALLS',
        requiresPutty: true,
        productCount: 3,
        roomTypeCodes: ['LIVING_ROOM', 'BEDROOM', 'KITCHEN', 'BATHROOM'],
      }),
      makeAdminCategory({
        id: adminIds.categories.ceilingFinish,
        name: { en: 'Ceiling finish', uk: 'Оздоблення стелі' },
        wastePercent: 5,
        surface: 'CEILING',
        requiresPutty: true,
        productCount: 2,
        roomTypeCodes: ['LIVING_ROOM', 'BEDROOM'],
      }),
      makeAdminCategory({
        id: adminIds.categories.plumbing,
        name: { en: 'Plumbing fixtures', uk: 'Сантехніка' },
        wastePercent: 0,
        surface: 'NONE',
        productCount: 2,
        roomTypeCodes: ['BATHROOM'],
      }),
      makeAdminCategory({
        id: adminIds.categories.unpublishedLighting,
        name: { en: 'Lighting', uk: 'Освітлення' },
        wastePercent: 0,
        surface: 'NONE',
        status: 'DRAFT',
        productCount: 0,
        roomTypeCodes: [],
      }),
      makeAdminCategory({
        id: adminIds.categories.legacyDecor,
        name: { en: 'Legacy decor', uk: 'Застарілий декор' },
        wastePercent: 0,
        surface: 'NONE',
        status: 'ARCHIVED',
        productCount: 1,
        roomTypeCodes: [],
      }),
    ],
  };
}

export function makeAdminRoomType(
  code: RoomTypeCode = 'LIVING_ROOM',
  overrides: Partial<AdminRoomType> = {},
): AdminRoomType {
  const categories = makeAdminCategories()
    .items.filter((category) => category.roomTypeCodes.includes(code))
    .map(({ id, name, status, surface }) => ({ id, name, status, surface }));
  return {
    id: adminIds.roomTypes[code],
    code,
    name: roomTypeNames[code],
    categories,
    ...makeStamp(),
    ...overrides,
  };
}

export function makeAdminRoomTypes(): AdminRoomTypesResponse {
  return {
    items: roomTypeCodes.map((code) => makeAdminRoomType(code)),
  };
}

export function makeAdminMaterialType(
  overrides: Partial<AdminMaterialType> = {},
): AdminMaterialType {
  return {
    id: adminIds.materialTypes.laminate,
    code: 'LAMINATE',
    name: { en: 'Laminate', uk: 'Ламінат' },
    status: 'PUBLISHED',
    ...makeStamp(),
    ...overrides,
  };
}

export function makeAdminMaterialTypes(): AdminMaterialTypesResponse {
  return {
    items: [
      makeAdminMaterialType(),
      makeAdminMaterialType({
        id: adminIds.materialTypes.tile,
        code: 'TILE',
        name: { en: 'Tile', uk: 'Плитка' },
      }),
      makeAdminMaterialType({
        id: adminIds.materialTypes.paint,
        code: 'PAINT',
        name: { en: 'Paint', uk: 'Фарба' },
      }),
      makeAdminMaterialType({
        id: adminIds.materialTypes.wallpaper,
        code: 'WALLPAPER',
        name: { en: 'Wallpaper', uk: 'Шпалери' },
        status: 'DRAFT',
      }),
    ],
  };
}
