import type {
  AdminProduct,
  CreateProductBody,
  UpdateProductBody,
} from '@/lib/admin-api/products';
import { ApiRequestError } from '@/lib/api/request-error';

export type ProductUnit = AdminProduct['unit'];

export type LocalizedValue = { en: string; uk: string };

export type ImageValue = {
  localId: string;
  imageId: string;
  previewUrl: string;
  primary: boolean;
};

export type AttributeValue = { name: LocalizedValue; value: LocalizedValue };

export type ProductValues = {
  categoryId: string;
  materialTypeId: string;
  name: LocalizedValue;
  description: LocalizedValue;
  brand: string;
  manufacturer: string;
  color: LocalizedValue;
  size: LocalizedValue;
  priceCents: number | null;
  unit: ProductUnit;
  wastePercentOverride: string;
  heatedFloorCompatible: boolean;
  images: ImageValue[];
  attributes: AttributeValue[];
  textureImageId: string | null;
  texturePreviewUrl: string | null;
  tileWidthMm: string;
  tileLengthMm: string;
  fallbackColor: string;
};

export type ProductSource = Pick<
  AdminProduct,
  | 'categoryId'
  | 'materialTypeId'
  | 'name'
  | 'description'
  | 'brand'
  | 'manufacturer'
  | 'color'
  | 'size'
  | 'priceCents'
  | 'unit'
  | 'wastePercentOverride'
  | 'heatedFloorCompatible'
  | 'images'
  | 'attributes'
  | 'tileWidthMm'
  | 'tileLengthMm'
  | 'fallbackColor'
  | 'texture'
>;

export const UNITS: readonly ProductUnit[] = ['SQM', 'LINEAR_M', 'PIECE'];

export const MAX_ATTRIBUTES = 30;

export const emptyAttribute = (): AttributeValue => ({
  name: { en: '', uk: '' },
  value: { en: '', uk: '' },
});

export const emptyValues: ProductValues = {
  categoryId: '',
  materialTypeId: '',
  name: { en: '', uk: '' },
  description: { en: '', uk: '' },
  brand: '',
  manufacturer: '',
  color: { en: '', uk: '' },
  size: { en: '', uk: '' },
  priceCents: null,
  unit: 'SQM',
  wastePercentOverride: '',
  heatedFloorCompatible: false,
  images: [],
  attributes: [],
  textureImageId: null,
  texturePreviewUrl: null,
  tileWidthMm: '',
  tileLengthMm: '',
  fallbackColor: '',
};

const localized = (value: LocalizedValue): LocalizedValue => ({
  en: value.en,
  uk: value.uk,
});

export const toValues = (product: ProductSource): ProductValues => ({
  categoryId: product.categoryId,
  materialTypeId: product.materialTypeId,
  name: localized(product.name),
  description: localized(product.description),
  brand: product.brand,
  manufacturer: product.manufacturer,
  color: localized(product.color),
  size: localized(product.size),
  priceCents: product.priceCents,
  unit: product.unit,
  wastePercentOverride:
    product.wastePercentOverride === null
      ? ''
      : String(product.wastePercentOverride),
  heatedFloorCompatible: product.heatedFloorCompatible,
  images: product.images.map((image) => ({
    localId: image.id,
    imageId: image.id,
    previewUrl: image.card,
    primary: image.isPrimary,
  })),
  attributes: product.attributes.map((attribute) => ({
    name: localized(attribute.name),
    value: localized(attribute.value),
  })),
  textureImageId: product.texture?.id ?? null,
  texturePreviewUrl: product.texture?.url ?? null,
  tileWidthMm: product.tileWidthMm === null ? '' : String(product.tileWidthMm),
  tileLengthMm:
    product.tileLengthMm === null ? '' : String(product.tileLengthMm),
  fallbackColor: product.fallbackColor ?? '',
});

export function normalizePrimary(images: ImageValue[]): ImageValue[] {
  if (images.length === 0) return images;
  const primaryId = (images.find((image) => image.primary) ?? images[0])
    .localId;
  return images.map((image) => ({
    ...image,
    primary: image.localId === primaryId,
  }));
}

type FieldFailure = { path: string; code: string; params?: unknown };

export type ValidationOptions = {
  hasSurface: boolean;
  publish: boolean;
  priceValid: boolean;
  colorValid: boolean;
};

const parseWholeNumber = (raw: string): number | null => {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  const value = Number(trimmed.replace(',', '.'));
  return Number.isInteger(value) && value > 0 ? value : Number.NaN;
};

const parseWaste = (raw: string): number | null => {
  const trimmed = raw.trim();
  return trimmed === '' ? null : Number(trimmed.replace(',', '.'));
};

const missing = (value: LocalizedValue, path: string): FieldFailure[] =>
  (['en', 'uk'] as const)
    .filter((language) => value[language].trim() === '')
    .map((language) => ({
      path: `${path}.${language}`,
      code: 'TRANSLATION_MISSING',
    }));

function wasteFailure(raw: string): FieldFailure | null {
  const waste = parseWaste(raw);
  if (waste === null) return null;
  const path = 'wastePercentOverride';
  if (Number.isNaN(waste)) return { path, code: 'INVALID_TYPE' };
  if (waste < 0) return { path, code: 'TOO_SMALL', params: { min: 0 } };
  if (waste > 100) return { path, code: 'TOO_BIG', params: { max: 100 } };
  return null;
}

function surfaceFailures(
  values: ProductValues,
  publish: boolean,
  colorValid: boolean,
): FieldFailure[] {
  const failures: FieldFailure[] = [];
  for (const key of ['tileWidthMm', 'tileLengthMm'] as const) {
    const parsed = parseWholeNumber(values[key]);
    if (Number.isNaN(parsed) || (publish && parsed === null)) {
      failures.push({ path: key, code: 'INVALID_TYPE' });
    }
  }
  if (!colorValid || (publish && values.fallbackColor === '')) {
    failures.push({ path: 'fallbackColor', code: 'INVALID_TYPE' });
  }
  if (publish && values.textureImageId === null) {
    failures.push({ path: 'textureImageId', code: 'INVALID_VALUE' });
  }
  return failures;
}

function translationFailures(values: ProductValues): FieldFailure[] {
  const failures = [
    ...missing(values.name, 'name'),
    ...missing(values.description, 'description'),
    ...missing(values.color, 'color'),
    ...missing(values.size, 'size'),
  ];
  values.attributes.forEach((attribute, index) => {
    failures.push(
      ...missing(attribute.name, `attributes[${index}].name`),
      ...missing(attribute.value, `attributes[${index}].value`),
    );
  });
  return failures;
}

export function collectFailures(
  values: ProductValues,
  { hasSurface, publish, priceValid, colorValid }: ValidationOptions,
): FieldFailure[] {
  const failures: FieldFailure[] = [];
  if (values.categoryId === '') {
    failures.push({ path: 'categoryId', code: 'INVALID_VALUE' });
  }
  if (values.materialTypeId === '') {
    failures.push({ path: 'materialTypeId', code: 'INVALID_VALUE' });
  }
  if (values.priceCents === null || !priceValid) {
    failures.push({ path: 'priceCents', code: 'INVALID_TYPE' });
  }
  const waste = wasteFailure(values.wastePercentOverride);
  if (waste) failures.push(waste);
  if (hasSurface)
    failures.push(...surfaceFailures(values, publish, colorValid));
  if (publish) failures.push(...translationFailures(values));
  return failures;
}

export function assertValid(
  values: ProductValues,
  options: ValidationOptions,
): void {
  const fields = collectFailures(values, options);
  if (fields.length > 0) {
    throw new ApiRequestError(400, {
      error: { code: 'VALIDATION_FAILED', fields },
    });
  }
}

export function toBody(
  values: ProductValues,
  hasSurface: boolean,
  confirmZeroPrice: boolean,
): CreateProductBody {
  const width = hasSurface ? parseWholeNumber(values.tileWidthMm) : null;
  const length = hasSurface ? parseWholeNumber(values.tileLengthMm) : null;
  return {
    categoryId: values.categoryId,
    materialTypeId: values.materialTypeId,
    name: values.name,
    description: values.description,
    brand: values.brand,
    manufacturer: values.manufacturer,
    color: values.color,
    size: values.size,
    priceCents: values.priceCents ?? 0,
    confirmZeroPrice,
    unit: values.unit,
    wastePercentOverride: parseWaste(values.wastePercentOverride),
    heatedFloorCompatible: values.heatedFloorCompatible,
    images: values.images.map((image) => ({
      imageId: image.imageId,
      isPrimary: image.primary,
    })),
    attributes: values.attributes,
    textureImageId: hasSurface ? values.textureImageId : null,
    tileWidthMm: width,
    tileLengthMm: length,
    fallbackColor:
      hasSurface && values.fallbackColor !== '' ? values.fallbackColor : null,
  };
}

export const toPatchBody = (
  values: ProductValues,
  hasSurface: boolean,
  confirmZeroPrice: boolean,
  revision: string,
): UpdateProductBody => ({
  ...toBody(values, hasSurface, confirmZeroPrice),
  revision,
});

export function affectsCost(
  values: ProductValues,
  initial: ProductValues,
): boolean {
  return (
    values.priceCents !== initial.priceCents ||
    values.unit !== initial.unit ||
    values.wastePercentOverride !== initial.wastePercentOverride ||
    values.categoryId !== initial.categoryId ||
    values.heatedFloorCompatible !== initial.heatedFloorCompatible
  );
}
