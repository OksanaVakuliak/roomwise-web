import type { components } from '@/generated/api';
import { makeAdminCategories } from './catalog';
import { adminIds, makeStamp } from './ids';

type Schemas = components['schemas'];

export type AdminRule = Schemas['RuleAdminDto_Output'];
export type AdminRulesResponse = Schemas['RuleListResponseDto_Output'];

export function makeAdminRule(overrides: Partial<AdminRule> = {}): AdminRule {
  return {
    id: adminIds.rules.categoryLaminate,
    level: 'CATEGORY',
    categoryId: adminIds.categories.flooring,
    materialTypeId: null,
    surface: null,
    baseComponent: false,
    name: { en: 'Laminate installation', uk: 'Укладання ламінату' },
    quantityFormula: 'surfaceArea * (1 + wastePercent / 100)',
    costFormula: 'quantity * product.priceCents',
    laborFormula: 'surfaceArea * LABOR_PER_SQM * 100',
    coefficientKeys: ['LABOR_PER_SQM'],
    sortOrder: 0,
    orphaned: false,
    ...makeStamp(),
    ...overrides,
  };
}

export function makeAdminRules(): AdminRulesResponse {
  const items = [
    makeAdminRule({
      id: adminIds.rules.objectBase,
      level: 'OBJECT',
      categoryId: null,
      baseComponent: true,
      name: { en: 'Base works', uk: 'Базові роботи' },
      quantityFormula: null,
      costFormula: 'object.totalAreaSqm * PUTTY_LAYERS * 100',
      laborFormula: null,
      coefficientKeys: ['PUTTY_LAYERS'],
    }),
    makeAdminRule(),
    makeAdminRule({
      id: adminIds.rules.materialTile,
      level: 'MATERIAL_TYPE',
      categoryId: null,
      materialTypeId: adminIds.materialTypes.tile,
      name: { en: 'Tile installation', uk: 'Укладання плитки' },
      costFormula: 'surfaceArea * TILE_ADHESIVE_KG_PER_SQM * 100',
      laborFormula: null,
      coefficientKeys: ['TILE_ADHESIVE_KG_PER_SQM'],
      sortOrder: 1,
    }),
    makeAdminRule({
      id: adminIds.rules.surfaceWalls,
      level: 'SURFACE',
      categoryId: null,
      surface: 'WALLS',
      name: { en: 'Wall preparation', uk: 'Підготовка стін' },
      quantityFormula: 'surfaceArea',
      costFormula: 'quantity * PUTTY_LAYERS * 100',
      laborFormula: null,
      coefficientKeys: ['PUTTY_LAYERS'],
      sortOrder: 2,
    }),
    makeAdminRule({
      id: adminIds.rules.orphan,
      categoryId: adminIds.categories.legacyDecor,
      name: { en: 'Legacy decor mounting', uk: 'Монтаж застарілого декору' },
      quantityFormula: null,
      costFormula: 'quantity * 500',
      laborFormula: null,
      coefficientKeys: [],
      sortOrder: 3,
      orphaned: true,
    }),
  ];
  const ruled = new Set(
    items
      .filter((rule) => rule.level === 'CATEGORY' && !rule.orphaned)
      .map((rule) => rule.categoryId),
  );
  return {
    items,
    categoriesWithoutRule: makeAdminCategories()
      .items.filter((category) => !ruled.has(category.id))
      .map(({ id, name }) => ({ id, name })),
  };
}
