import type { AdminCategory } from '@/lib/admin-api/catalog';
import { ApiRequestError } from '@/lib/api/request-error';

export type CategorySurface = AdminCategory['surface'];

export type CategoryValues = {
  name: { en: string; uk: string };
  wastePercent: string;
  surface: CategorySurface;
  requiresPutty: boolean;
};

export const SURFACES: readonly CategorySurface[] = [
  'NONE',
  'FLOOR',
  'WALLS',
  'CEILING',
];

export const emptyValues: CategoryValues = {
  name: { en: '', uk: '' },
  wastePercent: '0',
  surface: 'NONE',
  requiresPutty: true,
};

export const toValues = (category: AdminCategory): CategoryValues => ({
  name: { en: category.name.en, uk: category.name.uk },
  wastePercent: String(category.wastePercent),
  surface: category.surface,
  requiresPutty: category.requiresPutty,
});

type FieldFailure = { path: string; code: string; params?: unknown };

const fail = (fields: FieldFailure[]) =>
  new ApiRequestError(400, {
    error: { code: 'VALIDATION_FAILED', fields },
  });

export function parseWaste(raw: string): number {
  const value = raw.trim() === '' ? Number.NaN : Number(raw.replace(',', '.'));
  if (Number.isNaN(value)) {
    throw fail([{ path: 'wastePercent', code: 'INVALID_TYPE' }]);
  }
  if (value < 0) {
    throw fail([
      { path: 'wastePercent', code: 'TOO_SMALL', params: { min: 0 } },
    ]);
  }
  if (value > 100) {
    throw fail([
      { path: 'wastePercent', code: 'TOO_BIG', params: { max: 100 } },
    ]);
  }
  return value;
}

export function requireTranslations(name: CategoryValues['name']) {
  const missing = (['en', 'uk'] as const)
    .filter((language) => name[language].trim() === '')
    .map((language) => ({
      path: `name.${language}`,
      code: 'TRANSLATION_MISSING',
    }));
  if (missing.length > 0) throw fail(missing);
}
