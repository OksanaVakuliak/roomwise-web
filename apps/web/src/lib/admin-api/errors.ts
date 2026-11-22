import type { components } from '@/generated/api';
import { errorMessageKey } from '@/lib/api/errors';
import { ApiRequestError } from '@/lib/api/request-error';
import { isServerUnavailable } from '@/lib/api/server-unavailable';
import { DEFAULT_RETRY_AFTER_SECONDS } from '@/lib/api/write';

export type FormulaError =
  components['schemas']['ValidateFormulasResponseDto_Output']['errors'][number];

export type AdminFieldError = {
  path: string;
  code: string;
  params?: unknown;
};

export type AdminError =
  | { kind: 'unauthenticated' }
  | { kind: 'stale' }
  | { kind: 'inUse'; code: string; params: Record<string, unknown> }
  | { kind: 'demoForbidden'; action: string }
  | { kind: 'rateLimited'; retryAfterSeconds: number }
  | { kind: 'locked'; retryAfterSeconds: number }
  | { kind: 'invalidCredentials' }
  | { kind: 'validation'; fields: AdminFieldError[] }
  | { kind: 'formula'; errors: FormulaError[] }
  | { kind: 'unavailable' }
  | { kind: 'other'; code: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const retryAfter = (params: Record<string, unknown> | undefined): number => {
  const seconds = params?.retryAfterSeconds;
  return typeof seconds === 'number' && seconds > 0
    ? Math.ceil(seconds)
    : DEFAULT_RETRY_AFTER_SECONDS;
};

const isFormulaError = (value: unknown): value is FormulaError =>
  isRecord(value) &&
  typeof value.formula === 'string' &&
  typeof value.code === 'string' &&
  typeof value.position === 'number' &&
  typeof value.length === 'number';

const missingTranslations = (
  params: Record<string, unknown> | undefined,
): AdminFieldError[] => {
  const fields = params?.fields;
  return Array.isArray(fields)
    ? fields.flatMap((path) =>
        typeof path === 'string' ? [{ path, code: 'TRANSLATION_MISSING' }] : [],
      )
    : [];
};

export function toAdminError(failure: unknown): AdminError {
  if (!(failure instanceof ApiRequestError)) {
    return { kind: 'unavailable' };
  }
  const { code, params, fields } = failure.apiError;
  if (
    code === 'network' ||
    isServerUnavailable(failure.status, failure.apiError)
  ) {
    return { kind: 'unavailable' };
  }
  switch (code) {
    case 'UNAUTHENTICATED':
      return { kind: 'unauthenticated' };
    case 'INVALID_CREDENTIALS':
      return { kind: 'invalidCredentials' };
    case 'STALE_REVISION':
      return { kind: 'stale' };
    case 'DEMO_FORBIDDEN':
      return {
        kind: 'demoForbidden',
        action: typeof params?.action === 'string' ? params.action : '',
      };
    case 'RATE_LIMITED':
      return { kind: 'rateLimited', retryAfterSeconds: retryAfter(params) };
    case 'ACCOUNT_LOCKED':
      return { kind: 'locked', retryAfterSeconds: retryAfter(params) };
    case 'FORMULA_INVALID': {
      const errors = params?.errors;
      return {
        kind: 'formula',
        errors: Array.isArray(errors) ? errors.filter(isFormulaError) : [],
      };
    }
    case 'TRANSLATION_MISSING':
      return { kind: 'validation', fields: missingTranslations(params) };
  }
  if (code.endsWith('_IN_USE')) {
    return { kind: 'inUse', code, params: params ?? {} };
  }
  if (fields && fields.length > 0) {
    return { kind: 'validation', fields };
  }
  return { kind: 'other', code };
}

export type AdminErrorMessage = {
  namespace: 'AdminErrors' | 'Errors';
  key: string;
  values?: Record<string, number>;
};

export function adminErrorMessage(error: AdminError): AdminErrorMessage {
  switch (error.kind) {
    case 'rateLimited':
    case 'locked':
      return {
        namespace: 'AdminErrors',
        key: error.kind,
        values: { seconds: error.retryAfterSeconds },
      };
    case 'other':
      return { namespace: 'Errors', key: errorMessageKey(error.code) };
    default:
      return { namespace: 'AdminErrors', key: error.kind };
  }
}

const BOUND_CODES = {
  TOO_SHORT: 'min',
  TOO_FEW: 'min',
  TOO_SMALL: 'min',
  TOO_LONG: 'max',
  TOO_MANY: 'max',
  TOO_BIG: 'max',
} as const;

const PLAIN_FIELD_CODES = new Set([
  'INVALID_TYPE',
  'INVALID_FORMAT',
  'INVALID_VALUE',
  'NOT_MULTIPLE_OF',
  'TRANSLATION_MISSING',
]);

const INVALID_FIELD: AdminErrorMessage = {
  namespace: 'AdminErrors',
  key: 'field.invalid',
};

export function fieldErrorMessage(field: AdminFieldError): AdminErrorMessage {
  const { code } = field;
  if (code in BOUND_CODES) {
    const bound = BOUND_CODES[code as keyof typeof BOUND_CODES];
    const value = isRecord(field.params) ? field.params[bound] : undefined;
    return typeof value === 'number'
      ? {
          namespace: 'AdminErrors',
          key: `field.${code}`,
          values: { [bound]: value },
        }
      : INVALID_FIELD;
  }
  if (PLAIN_FIELD_CODES.has(code)) {
    return { namespace: 'AdminErrors', key: `field.${code}` };
  }
  const known = errorMessageKey(code);
  return known === 'unknown'
    ? INVALID_FIELD
    : { namespace: 'Errors', key: known };
}
