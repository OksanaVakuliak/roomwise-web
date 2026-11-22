import type { components } from '@/generated/api';

export type AdminExchangeRate =
  components['schemas']['ExchangeRateStatusDto_Output'];

export function makeNbuExchangeRate(
  overrides: Partial<AdminExchangeRate> = {},
): AdminExchangeRate {
  return {
    active: { rate: '41.5000', date: '2026-11-20', source: 'NBU' },
    official: { rate: '41.5000', date: '2026-11-20' },
    manual: null,
    lastSuccessfulFetchDate: '2026-11-20',
    lastAttemptAt: '2026-11-20T06:00:00.000Z',
    lastError: null,
    staleSince: null,
    ...overrides,
  };
}

export function makeManualExchangeRate(
  overrides: Partial<AdminExchangeRate> = {},
): AdminExchangeRate {
  return makeNbuExchangeRate({
    active: { rate: '42.0000', date: '2026-11-21', source: 'MANUAL' },
    manual: { rate: '42.0000', date: '2026-11-21' },
    ...overrides,
  });
}

export function makeStaleExchangeRate(
  overrides: Partial<AdminExchangeRate> = {},
): AdminExchangeRate {
  return makeNbuExchangeRate({
    active: { rate: '41.2000', date: '2026-11-15', source: 'NBU' },
    official: { rate: '41.2000', date: '2026-11-15' },
    lastSuccessfulFetchDate: '2026-11-15',
    lastAttemptAt: '2026-11-21T06:00:00.000Z',
    lastError: 'NBU request timed out',
    staleSince: '2026-11-17T06:00:00.000Z',
    ...overrides,
  });
}
