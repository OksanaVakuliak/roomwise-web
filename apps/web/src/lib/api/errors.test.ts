import { describe, expect, it } from 'vitest';
import en from '../../../messages/en.json';
import uk from '../../../messages/uk.json';
import {
  BACKEND_ERROR_CODES,
  ESTIMATE_LINE_ERROR_CODES,
  ESTIMATE_WARNING_CODES,
  errorMessageKey,
  lineErrorKey,
  networkError,
  parseApiError,
  warningKey,
} from './errors';

describe('parseApiError', () => {
  it('parses a code-only envelope', () => {
    expect(parseApiError({ error: { code: 'NOT_FOUND' } })).toEqual({
      code: 'NOT_FOUND',
    });
  });

  it('keeps params and valid fields', () => {
    const body = {
      error: {
        code: 'VALIDATION_FAILED',
        params: { retryAfterSeconds: 3 },
        fields: [
          { path: 'login', code: 'too_small', params: { minimum: 3 } },
          { path: 'password', code: 'required' },
          { path: 1, code: 'bad' },
          null,
        ],
      },
    };
    expect(parseApiError(body)).toEqual({
      code: 'VALIDATION_FAILED',
      params: { retryAfterSeconds: 3 },
      fields: [
        { path: 'login', code: 'too_small', params: { minimum: 3 } },
        { path: 'password', code: 'required' },
      ],
    });
  });

  it.each([
    undefined,
    null,
    'text',
    42,
    [],
    {},
    { error: null },
    { error: 'NOT_FOUND' },
    { error: {} },
    { error: { code: 5 } },
    { error: { code: '' } },
  ])('returns unknown for invalid body %j', (body) => {
    expect(parseApiError(body)).toEqual({ code: 'unknown' });
  });

  it('builds a network error', () => {
    expect(networkError()).toEqual({ code: 'network' });
  });
});

describe('errorMessageKey', () => {
  it('maps known codes to themselves', () => {
    expect(errorMessageKey('RATE_LIMITED')).toBe('RATE_LIMITED');
    expect(errorMessageKey('network')).toBe('network');
  });

  it.each([
    'STYLE_NOT_FOUND',
    'CALCULATION_NOT_FOUND',
    'INPUT_OUT_OF_BOUNDS',
    'UNKNOWN_REFERENCE',
    'IDEMPOTENCY_KEY_REQUIRED',
    'IDEMPOTENCY_KEY_REUSED',
    'IDEMPOTENCY_KEY_CONFLICT',
    'PHONE_INVALID',
  ])('recognises the %s code', (code) => {
    expect(BACKEND_ERROR_CODES).toContain(code);
    expect(parseApiError({ error: { code } })).toEqual({ code });
    expect(errorMessageKey(code)).toBe(code);
  });

  it('maps unrecognised codes to unknown', () => {
    expect(errorMessageKey('SOMETHING_NEW')).toBe('unknown');
  });

  it.each([
    ['en', en],
    ['uk', uk],
  ])('has every returned key in the %s catalog', (_locale, catalog) => {
    const codes = [
      ...BACKEND_ERROR_CODES,
      'unknown',
      'network',
      'SOMETHING_NEW',
    ];
    const messages: Record<string, string> = catalog.Errors;
    for (const code of codes) {
      expect(messages[errorMessageKey(code)]).toBeTruthy();
    }
  });

  it('keeps catalog key sets identical', () => {
    expect(Object.keys(uk.Errors).sort()).toEqual(
      Object.keys(en.Errors).sort(),
    );
  });
});

describe('estimate message keys', () => {
  it('maps known line error codes to themselves and others to generic', () => {
    expect(lineErrorKey('RULE_NOT_FOUND')).toBe('RULE_NOT_FOUND');
    expect(lineErrorKey('FORMULA_DIVISION_BY_ZERO')).toBe('generic');
  });

  it('maps known warning codes to themselves and others to generic', () => {
    expect(warningKey('ROOMS_AREA_EXCEEDS_TOTAL')).toBe(
      'ROOMS_AREA_EXCEEDS_TOTAL',
    );
    expect(warningKey('SOMETHING_NEW')).toBe('generic');
  });

  it.each([
    ['en', en],
    ['uk', uk],
  ])('has every key in the %s Estimate catalog', (_locale, catalog) => {
    for (const code of ESTIMATE_LINE_ERROR_CODES) {
      expect(catalog.Estimate.lineError[code]).toBeTruthy();
    }
    for (const code of ESTIMATE_WARNING_CODES) {
      expect(catalog.Estimate.warning[code]).toBeTruthy();
    }
    expect(catalog.Estimate.lineError.generic).toBeTruthy();
    expect(catalog.Estimate.warning.generic).toBeTruthy();
  });
});
