import { describe, expect, it } from 'vitest';
import { ApiRequestError } from '@/lib/api/request-error';
import { adminErrors, makeAdminFailure } from '@/test/fixtures/admin/errors';
import en from '../../../messages/en.json';
import uk from '../../../messages/uk.json';
import { type AdminError, adminErrorMessage, toAdminError } from './errors';

const fail = ({ status, body }: { status: number; body: unknown }) =>
  new ApiRequestError(status, body);

describe('toAdminError', () => {
  it('maps unauthenticated', () => {
    expect(toAdminError(fail(adminErrors.unauthenticated()))).toEqual({
      kind: 'unauthenticated',
    });
  });

  it('maps invalid credentials', () => {
    expect(toAdminError(fail(adminErrors.invalidCredentials()))).toEqual({
      kind: 'invalidCredentials',
    });
  });

  it('maps stale revisions', () => {
    expect(toAdminError(fail(adminErrors.staleRevision()))).toEqual({
      kind: 'stale',
    });
  });

  it.each([
    ['PRODUCT_IN_USE', adminErrors.productInUse()],
    ['CATEGORY_IN_USE', adminErrors.categoryInUse()],
    ['COEFFICIENT_IN_USE', adminErrors.coefficientInUse()],
  ])('maps %s to inUse with its params', (code, failure) => {
    expect(toAdminError(fail(failure))).toEqual({
      kind: 'inUse',
      code,
      params: failure.body.error.params,
    });
  });

  it('maps demo restrictions with the action', () => {
    expect(toAdminError(fail(adminErrors.demoForbidden('upload')))).toEqual({
      kind: 'demoForbidden',
      action: 'upload',
    });
  });

  it('maps 429 and 423 with retryAfterSeconds', () => {
    expect(toAdminError(fail(adminErrors.rateLimited(12)))).toEqual({
      kind: 'rateLimited',
      retryAfterSeconds: 12,
    });
    expect(toAdminError(fail(adminErrors.locked(900)))).toEqual({
      kind: 'locked',
      retryAfterSeconds: 900,
    });
  });

  it('falls back to the default wait without retryAfterSeconds', () => {
    expect(toAdminError(fail(makeAdminFailure(429, 'RATE_LIMITED')))).toEqual({
      kind: 'rateLimited',
      retryAfterSeconds: 60,
    });
  });

  it('rounds fractional waits up', () => {
    expect(toAdminError(fail(adminErrors.rateLimited(1.2)))).toEqual({
      kind: 'rateLimited',
      retryAfterSeconds: 2,
    });
  });

  it('maps field errors to validation', () => {
    expect(toAdminError(fail(adminErrors.validation()))).toEqual({
      kind: 'validation',
      fields: [
        { path: 'wastePercent', code: 'TOO_BIG', params: { max: 100 } },
        { path: 'name.en', code: 'TOO_SHORT', params: { min: 1 } },
      ],
    });
  });

  it('maps missing translations to validation fields', () => {
    expect(toAdminError(fail(adminErrors.translationMissing()))).toEqual({
      kind: 'validation',
      fields: [{ path: 'name.uk', code: 'TRANSLATION_MISSING' }],
    });
  });

  it('maps formula errors', () => {
    const error = {
      formula: 'cost',
      code: 'UNKNOWN_VARIABLE',
      position: 4,
      length: 3,
      params: { name: 'abc' },
    };
    const failure = makeAdminFailure(422, 'FORMULA_INVALID', {
      params: { errors: [error, { broken: true }] },
    });
    expect(toAdminError(fail(failure))).toEqual({
      kind: 'formula',
      errors: [error],
    });
  });

  it('maps gateway failures and network errors to unavailable', () => {
    expect(toAdminError(fail(makeAdminFailure(503, 'X')))).toEqual({
      kind: 'unavailable',
    });
    expect(
      toAdminError(new ApiRequestError(0, { error: { code: 'network' } })),
    ).toEqual({ kind: 'unavailable' });
    expect(toAdminError(new TypeError('offline'))).toEqual({
      kind: 'unavailable',
    });
  });

  it('keeps unrecognised codes as other', () => {
    expect(toAdminError(fail(makeAdminFailure(409, 'CODE_TAKEN')))).toEqual({
      kind: 'other',
      code: 'CODE_TAKEN',
    });
  });
});

describe('adminErrorMessage', () => {
  const kinds: AdminError[] = [
    { kind: 'unauthenticated' },
    { kind: 'stale' },
    { kind: 'inUse', code: 'PRODUCT_IN_USE', params: {} },
    { kind: 'demoForbidden', action: 'x' },
    { kind: 'rateLimited', retryAfterSeconds: 5 },
    { kind: 'locked', retryAfterSeconds: 5 },
    { kind: 'invalidCredentials' },
    { kind: 'validation', fields: [] },
    { kind: 'formula', errors: [] },
    { kind: 'unavailable' },
    { kind: 'other', code: 'X' },
  ];

  it('passes the countdown for rate limits and locks', () => {
    expect(adminErrorMessage(kinds[4])).toEqual({
      namespace: 'AdminErrors',
      key: 'rateLimited',
      values: { seconds: 5 },
    });
    expect(adminErrorMessage(kinds[5])).toEqual({
      namespace: 'AdminErrors',
      key: 'locked',
      values: { seconds: 5 },
    });
  });

  it('uses the backend code message for other errors', () => {
    expect(adminErrorMessage({ kind: 'other', code: 'CODE_TAKEN' })).toEqual({
      namespace: 'Errors',
      key: 'CODE_TAKEN',
    });
    expect(adminErrorMessage(kinds[10])).toEqual({
      namespace: 'Errors',
      key: 'unknown',
    });
  });

  it.each([
    ['en', en],
    ['uk', uk],
  ])('has every key in the %s AdminErrors catalog', (_locale, catalog) => {
    for (const error of kinds) {
      const { namespace, key } = adminErrorMessage(error);
      const messages: Record<string, string> = catalog[namespace];
      expect(messages[key]).toBeTruthy();
    }
  });

  it('keeps catalog key sets identical', () => {
    expect(Object.keys(uk.AdminErrors).sort()).toEqual(
      Object.keys(en.AdminErrors).sort(),
    );
  });
});
