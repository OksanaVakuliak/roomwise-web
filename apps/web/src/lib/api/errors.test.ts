import { describe, expect, it } from 'vitest';
import en from '../../../messages/en.json';
import uk from '../../../messages/uk.json';
import {
  BACKEND_ERROR_CODES,
  errorMessageKey,
  networkError,
  parseApiError,
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
