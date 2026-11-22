import type { components } from '@/generated/api';
import { adminIds } from './ids';

export type AdminErrorBody = components['schemas']['ErrorResponseDto'];

export type AdminFailure = { status: number; body: AdminErrorBody };

type ErrorDetail = AdminErrorBody['error'];

export function makeAdminFailure(
  status: number,
  code: string,
  rest: Omit<ErrorDetail, 'code'> = {},
): AdminFailure {
  return { status, body: { error: { code, ...rest } } };
}

export const adminErrors = {
  unauthenticated: (): AdminFailure => makeAdminFailure(401, 'UNAUTHENTICATED'),
  invalidCredentials: (): AdminFailure =>
    makeAdminFailure(401, 'INVALID_CREDENTIALS'),
  staleRevision: (): AdminFailure => makeAdminFailure(409, 'STALE_REVISION'),
  productInUse: (): AdminFailure =>
    makeAdminFailure(409, 'PRODUCT_IN_USE', {
      params: {
        styles: [
          {
            id: adminIds.styles.modern,
            name: { en: 'Modern', uk: 'Сучасний' },
          },
        ],
      },
    }),
  categoryInUse: (): AdminFailure =>
    makeAdminFailure(409, 'CATEGORY_IN_USE', {
      params: {
        productCount: 3,
        roomTypeCodes: ['LIVING_ROOM', 'BEDROOM'],
        styles: [
          {
            id: adminIds.styles.modern,
            name: { en: 'Modern', uk: 'Сучасний' },
          },
        ],
      },
    }),
  coefficientInUse: (): AdminFailure =>
    makeAdminFailure(409, 'COEFFICIENT_IN_USE', {
      params: {
        rules: [
          {
            ruleId: adminIds.rules.categoryLaminate,
            ruleName: { en: 'Laminate laying', uk: 'Укладання ламінату' },
          },
        ],
        options: [
          {
            optionId: adminIds.options.heatedFloor,
            optionName: { en: 'Heated floor', uk: 'Тепла підлога' },
          },
        ],
      },
    }),
  demoForbidden: (action = 'change-password'): AdminFailure =>
    makeAdminFailure(403, 'DEMO_FORBIDDEN', { params: { action } }),
  locked: (retryAfterSeconds = 900): AdminFailure =>
    makeAdminFailure(423, 'ACCOUNT_LOCKED', { params: { retryAfterSeconds } }),
  rateLimited: (retryAfterSeconds = 30): AdminFailure =>
    makeAdminFailure(429, 'RATE_LIMITED', { params: { retryAfterSeconds } }),
  validation: (): AdminFailure =>
    makeAdminFailure(400, 'VALIDATION_FAILED', {
      fields: [
        { path: 'wastePercent', code: 'TOO_BIG', params: { max: 100 } },
        { path: 'name.en', code: 'TOO_SHORT', params: { min: 1 } },
      ],
    }),
  translationMissing: (): AdminFailure =>
    makeAdminFailure(422, 'TRANSLATION_MISSING', {
      params: { fields: ['name.uk'] },
    }),
} as const;
