import type { Locale } from 'next-intl';
import type { Currency } from './currencies';

const NBSP = '\u00a0';

const areaUnit: Record<Locale, string> = { en: 'm²', uk: 'м²' };
const lengthUnit: Record<Locale, string> = { en: 'm', uk: 'м' };

export type ExchangeRate = { uahPerUsd: number };

export function money(
  cents: number,
  currency: Currency,
  locale: Locale,
  rate?: ExchangeRate,
): string {
  if (currency === 'USD') {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(cents / 100);
  }
  if (!rate) {
    throw new Error('UAH requires an exchange rate');
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format((cents / 100) * rate.uahPerUsd);
}

function measure(value: number, locale: Locale, unit: string): string {
  const number = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
  }).format(value);
  return `${number}${NBSP}${unit}`;
}

export function area(squareMeters: number, locale: Locale): string {
  return measure(squareMeters, locale, areaUnit[locale]);
}

export function dimension(meters: number, locale: Locale): string {
  return measure(meters, locale, lengthUnit[locale]);
}

export function percent(fraction: number, locale: Locale): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(fraction);
}
