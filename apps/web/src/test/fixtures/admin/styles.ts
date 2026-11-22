import type { components } from '@/generated/api';
import { makeAdminCategories } from './catalog';
import { adminIds, makeAdminImageRef, makeStamp } from './ids';

type Schemas = components['schemas'];

export type AdminStyle = Schemas['StyleAdminDto_Output'];
export type AdminStylesResponse = Schemas['StyleAdminListResponseDto_Output'];
export type AdminStyleRow = AdminStylesResponse['items'][number];
export type AdminStylePair = AdminStyle['pairs'][number];

const categoryName = (id: string): AdminStylePair['categoryName'] => {
  const category = makeAdminCategories().items.find((item) => item.id === id);
  return category?.name ?? { en: '', uk: '' };
};

export function makeAdminStylePair(
  overrides: Partial<AdminStylePair> = {},
): AdminStylePair {
  return {
    roomTypeCode: 'LIVING_ROOM',
    roomTypeId: adminIds.roomTypes.LIVING_ROOM,
    categoryId: adminIds.categories.flooring,
    categoryName: categoryName(adminIds.categories.flooring),
    productId: adminIds.products.laminate,
    productName: { en: 'Oak Natural Laminate', uk: 'Ламінат Дуб натуральний' },
    state: 'FILLED',
    ...overrides,
  };
}

export function makeAdminStyle(
  overrides: Partial<AdminStyle> = {},
): AdminStyle {
  return {
    id: adminIds.styles.modern,
    name: { en: 'Modern', uk: 'Модерн' },
    description: {
      en: 'Clean lines and a neutral palette.',
      uk: 'Чіткі лінії та нейтральна палітра.',
    },
    image: makeAdminImageRef(),
    status: 'PUBLISHED',
    sortOrder: 0,
    pairs: [
      makeAdminStylePair(),
      makeAdminStylePair({
        categoryId: adminIds.categories.wallFinish,
        categoryName: categoryName(adminIds.categories.wallFinish),
        productId: adminIds.products.inStyle,
        productName: {
          en: 'Silk Matt Paint',
          uk: 'Шовковисто-матова фарба',
        },
      }),
      makeAdminStylePair({
        categoryId: adminIds.categories.ceilingFinish,
        categoryName: categoryName(adminIds.categories.ceilingFinish),
        productId: null,
        productName: null,
        state: 'EMPTY',
      }),
      makeAdminStylePair({
        roomTypeCode: 'BEDROOM',
        roomTypeId: adminIds.roomTypes.BEDROOM,
        productId: adminIds.products.archived,
        productName: {
          en: 'Retired Decor Panel',
          uk: 'Знятий з виробництва панель',
        },
        state: 'PRODUCT_UNAVAILABLE',
      }),
    ],
    unfilledCount: 1,
    unavailableCount: 1,
    ...makeStamp(),
    ...overrides,
  };
}

export function makeAdminStyleRow(
  style: AdminStyle = makeAdminStyle(),
): AdminStyleRow {
  return {
    id: style.id,
    name: style.name,
    description: style.description,
    image: style.image,
    status: style.status,
    sortOrder: style.sortOrder,
    revision: style.revision,
    updatedAt: style.updatedAt,
    updatedBy: style.updatedBy,
    unfilledPairs: style.unfilledCount,
    unavailablePairs: style.unavailableCount,
  };
}

export function makeAdminStyles(): AdminStylesResponse {
  const classic = makeAdminStyle({
    id: adminIds.styles.classic,
    name: { en: 'Classic', uk: 'Класика' },
    sortOrder: 1,
    pairs: [makeAdminStylePair()],
    unfilledCount: 0,
    unavailableCount: 0,
  });
  const draft = makeAdminStyle({
    id: adminIds.styles.draft,
    name: { en: 'Loft', uk: '' },
    description: { en: 'Industrial look.', uk: '' },
    image: null,
    status: 'DRAFT',
    sortOrder: 2,
    pairs: [],
    unfilledCount: 0,
    unavailableCount: 0,
  });
  return {
    items: [
      makeAdminStyleRow(),
      makeAdminStyleRow(classic),
      makeAdminStyleRow(draft),
    ],
  };
}
