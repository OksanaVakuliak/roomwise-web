import type { components } from '@/generated/api';
import { adminIds, makeStamp } from './ids';

type Schemas = components['schemas'];

export type AdminCoefficient = Schemas['CoefficientAdminDto_Output'];
export type AdminCoefficientsResponse =
  Schemas['CoefficientListResponseDto_Output'];

export function makeAdminCoefficient(
  overrides: Partial<AdminCoefficient> = {},
): AdminCoefficient {
  return {
    id: adminIds.coefficients.laborRate,
    key: 'LABOR_PER_SQM',
    name: { en: 'Labor per square meter', uk: 'Робота за квадратний метр' },
    value: 12.5,
    unit: { en: 'USD/sqm', uk: 'USD/м²' },
    group: 'LABOR',
    usedBy: [
      {
        ruleId: adminIds.rules.categoryLaminate,
        ruleName: { en: 'Laminate installation', uk: 'Укладання ламінату' },
      },
    ],
    usedByOptions: [],
    ...makeStamp(),
    ...overrides,
  };
}

export function makeAdminCoefficients(): AdminCoefficientsResponse {
  return {
    items: [
      makeAdminCoefficient(),
      makeAdminCoefficient({
        id: adminIds.coefficients.puttyLayers,
        key: 'PUTTY_LAYERS',
        name: { en: 'Putty layers', uk: 'Шари шпаклівки' },
        value: 2,
        unit: { en: 'layers', uk: 'шарів' },
        group: 'PREPARATION',
        usedBy: [
          {
            ruleId: adminIds.rules.surfaceWalls,
            ruleName: { en: 'Wall preparation', uk: 'Підготовка стін' },
          },
          {
            ruleId: adminIds.rules.objectBase,
            ruleName: { en: 'Base works', uk: 'Базові роботи' },
          },
        ],
      }),
      makeAdminCoefficient({
        id: adminIds.coefficients.adhesive,
        key: 'TILE_ADHESIVE_KG_PER_SQM',
        name: { en: 'Tile adhesive', uk: 'Клей для плитки' },
        value: 4.5,
        unit: { en: 'kg/sqm', uk: 'кг/м²' },
        group: 'ROUGH_MATERIAL',
        usedBy: [
          {
            ruleId: adminIds.rules.materialTile,
            ruleName: { en: 'Tile installation', uk: 'Укладання плитки' },
          },
        ],
      }),
      makeAdminCoefficient({
        id: adminIds.coefficients.cablePerRoom,
        key: 'HEATED_FLOOR_PER_SQM',
        name: { en: 'Heated floor price', uk: 'Ціна теплої підлоги' },
        value: 38,
        unit: { en: 'USD/sqm', uk: 'USD/м²' },
        group: 'ENGINEERING',
        usedBy: [],
        usedByOptions: [
          {
            optionId: adminIds.options.heatedFloor,
            optionName: { en: 'Heated floor', uk: 'Тепла підлога' },
          },
        ],
      }),
      makeAdminCoefficient({
        id: adminIds.coefficients.unusedExtra,
        key: 'UNUSED_EXTRA',
        name: { en: 'Unused extra', uk: 'Невикористана надбавка' },
        value: 1,
        unit: { en: 'pcs', uk: 'шт' },
        group: 'MATERIAL_EXTRA',
        usedBy: [],
      }),
    ],
  };
}
