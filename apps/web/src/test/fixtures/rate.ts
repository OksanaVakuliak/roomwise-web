import type { ExchangeRate } from '@/lib/format';

export type RateFixture = ExchangeRate & { date: string };

export function makeRate(overrides: Partial<RateFixture> = {}): RateFixture {
  return { uahPerUsd: 41.5, date: '2026-10-01', ...overrides };
}
