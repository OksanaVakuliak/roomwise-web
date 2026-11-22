import type { components } from '@/generated/api';
import { adminIds, makeAdminImageRef, makeStamp } from './ids';

type Schemas = components['schemas'];

export type AdminOption = Schemas['OptionAdminDto_Output'];
export type AdminOptionsResponse = Schemas['OptionAdminListResponseDto_Output'];

export function makeAdminOption(
  overrides: Partial<AdminOption> = {},
): AdminOption {
  return {
    id: adminIds.options.heatedFloor,
    code: 'HEATED_FLOOR',
    kind: 'ENGINEERING',
    name: { en: 'Heated floor', uk: 'Тепла підлога' },
    description: {
      en: 'Electric heating mats under the floor finish.',
      uk: 'Електричні нагрівальні мати під покриття підлоги.',
    },
    image: null,
    priceCents: null,
    unit: 'ROOM_SQM',
    perRoom: true,
    minQuantity: null,
    maxQuantity: null,
    roomTypeIds: [
      adminIds.roomTypes.BATHROOM,
      adminIds.roomTypes.KITCHEN,
      adminIds.roomTypes.HALLWAY,
    ],
    priceCoefficientKeys: ['HEATED_FLOOR_PER_SQM'],
    scopes: ['FULL', 'PARTIAL'],
    sortOrder: 0,
    status: 'PUBLISHED',
    ...makeStamp(),
    ...overrides,
  };
}

export function makeAdminOptions(): AdminOptionsResponse {
  return {
    items: [
      makeAdminOption(),
      makeAdminOption({
        id: adminIds.options.airConditioner,
        code: null,
        name: { en: 'Air conditioner', uk: 'Кондиціонер' },
        description: {
          en: 'Split system with installation.',
          uk: 'Спліт-система з монтажем.',
        },
        image: makeAdminImageRef(),
        priceCents: 85000,
        unit: 'PIECE',
        perRoom: true,
        minQuantity: 1,
        maxQuantity: 4,
        roomTypeIds: [
          adminIds.roomTypes.LIVING_ROOM,
          adminIds.roomTypes.BEDROOM,
        ],
        priceCoefficientKeys: [],
        scopes: ['FULL'],
        sortOrder: 1,
      }),
      makeAdminOption({
        id: adminIds.options.smartHome,
        code: null,
        kind: 'ADDITIONAL',
        name: { en: 'Smart home kit', uk: 'Комплект розумного дому' },
        description: { en: 'Hub and sensors.', uk: '' },
        priceCents: 120000,
        unit: 'PROJECT',
        perRoom: false,
        roomTypeIds: [],
        priceCoefficientKeys: [],
        scopes: ['FULL'],
        sortOrder: 0,
        status: 'DRAFT',
      }),
      makeAdminOption({
        id: adminIds.options.cleaning,
        code: null,
        kind: 'ADDITIONAL',
        name: {
          en: 'Post-renovation cleaning',
          uk: 'Прибирання після ремонту',
        },
        description: {
          en: 'Cleaning of the finished object.',
          uk: 'Прибирання готового об’єкта.',
        },
        priceCents: null,
        unit: 'ROOM_SQM',
        perRoom: false,
        roomTypeIds: [],
        priceCoefficientKeys: ['CLEANING_PER_SQM'],
        scopes: ['FULL', 'PARTIAL'],
        sortOrder: 1,
      }),
    ],
  };
}
