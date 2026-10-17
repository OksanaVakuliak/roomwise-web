import type { components } from '@/generated/api';

type Envelope = components['schemas']['ErrorResponseDto']['error'];

export const BACKEND_ERROR_CODES = [
  'VALIDATION_FAILED',
  'UNAUTHENTICATED',
  'INVALID_CREDENTIALS',
  'ACCOUNT_LOCKED',
  'DEMO_FORBIDDEN',
  'NOT_FOUND',
  'PRODUCT_UNAVAILABLE',
  'STALE_REVISION',
  'PAYLOAD_TOO_LARGE',
  'TRANSLATION_MISSING',
  'UNSUPPORTED_IMAGE_TYPE',
  'IMAGE_STORAGE_FAILED',
  'CATEGORY_ARCHIVED',
  'CATEGORY_IN_USE',
  'CATEGORY_NOT_FOUND',
  'MATERIAL_TYPE_NOT_FOUND',
  'IMAGE_NOT_FOUND',
  'CODE_TAKEN',
  'ZERO_PRICE_NOT_CONFIRMED',
  'SURFACE_DATA_MISSING',
  'PRIMARY_IMAGE_MISSING',
  'PRODUCT_IN_USE',
  'STYLE_SET_MISMATCH',
  'STYLE_IMAGE_MISSING',
  'PAIR_NOT_IN_ROOM_TYPE',
  'PRODUCT_CATEGORY_MISMATCH',
  'PRODUCT_NOT_FOUND',
  'PRICE_REQUIRED',
  'QUANTITY_BOUNDS_REQUIRED',
  'ROOM_TYPES_NOT_ALLOWED',
  'ROOM_TYPE_NOT_FOUND',
  'RATE_LIMITED',
  'INTERNAL',
  'FORBIDDEN',
  'CONFLICT',
  'UNPROCESSABLE',
] as const;

export type BackendErrorCode = (typeof BACKEND_ERROR_CODES)[number];
export type ClientErrorCode = 'unknown' | 'network';
export type ApiErrorCode = BackendErrorCode | ClientErrorCode;

export type ApiErrorField = NonNullable<Envelope['fields']>[number];

export type ApiError = {
  code: string;
  params?: Envelope['params'];
  fields?: ApiErrorField[];
};

const knownCodes: ReadonlySet<string> = new Set(BACKEND_ERROR_CODES);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const parseField = (value: unknown): ApiErrorField | null => {
  if (
    !isRecord(value) ||
    typeof value.path !== 'string' ||
    typeof value.code !== 'string'
  ) {
    return null;
  }
  return isRecord(value.params)
    ? { path: value.path, code: value.code, params: value.params }
    : { path: value.path, code: value.code };
};

export const parseApiError = (body: unknown): ApiError => {
  if (!isRecord(body) || !isRecord(body.error)) {
    return { code: 'unknown' };
  }
  const { code, params, fields } = body.error;
  if (typeof code !== 'string' || code === '') {
    return { code: 'unknown' };
  }
  const error: ApiError = { code };
  if (isRecord(params)) {
    error.params = params;
  }
  if (Array.isArray(fields)) {
    error.fields = fields.flatMap((field) => parseField(field) ?? []);
  }
  return error;
};

export const networkError = (): ApiError => ({ code: 'network' });

export const errorMessageKey = (code: string): ApiErrorCode =>
  knownCodes.has(code) || code === 'network'
    ? (code as ApiErrorCode)
    : 'unknown';
