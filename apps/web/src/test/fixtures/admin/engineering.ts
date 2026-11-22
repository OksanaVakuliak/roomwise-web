import type { components } from '@/generated/api';
import { adminIds, makeStamp } from './ids';

type Schemas = components['schemas'];

export type AdminPackageItem = Schemas['EngineeringPackageItemAdminDto_Output'];
export type AdminPackageItemsResponse =
  Schemas['EngineeringPackageItemAdminListResponseDto_Output'];

export function makeAdminPackageItem(
  overrides: Partial<AdminPackageItem> = {},
): AdminPackageItem {
  return {
    id: adminIds.packageItems.wiring,
    name: { en: 'Electrical wiring', uk: 'Електропроводка' },
    description: {
      en: 'Copper wiring with a distribution panel.',
      uk: 'Мідна проводка з розподільним щитком.',
    },
    includedInBase: true,
    priceCents: null,
    unit: null,
    status: 'PUBLISHED',
    sortOrder: 0,
    ...makeStamp(),
    ...overrides,
  };
}

export function makeAdminPackageItems(): AdminPackageItemsResponse {
  return {
    items: [
      makeAdminPackageItem(),
      makeAdminPackageItem({
        id: adminIds.packageItems.plumbing,
        name: { en: 'Plumbing', uk: 'Сантехнічна розводка' },
        description: {
          en: 'Water supply and drainage.',
          uk: 'Водопостачання та каналізація.',
        },
        sortOrder: 1,
      }),
      makeAdminPackageItem({
        id: adminIds.packageItems.ventilation,
        name: { en: 'Ventilation', uk: 'Вентиляція' },
        description: { en: 'Forced ventilation.', uk: '' },
        includedInBase: false,
        priceCents: 18000,
        unit: 'ROOM',
        status: 'DRAFT',
        sortOrder: 2,
      }),
    ],
  };
}
