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
    const rounded = Math.round(cents);
    const fraction = rounded % 100 === 0 ? 0 : 2;
    const sign = rounded < 0 ? '-' : '';
    return `${sign}$${amount(Math.abs(rounded) / 100, locale, fraction)}`;
  }
  if (!rate) {
    throw new Error('UAH requires an exchange rate');
  }
  const uah = Math.round(Math.abs(cents / 100) * rate.uahPerUsd);
  const sign = cents < 0 && uah > 0 ? '-' : '';
  return `${sign}${amount(uah, locale, 0)}${NBSP}₴`;
}

function amount(value: number, locale: Locale, fraction: number): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: fraction,
    maximumFractionDigits: fraction,
  })
    .format(value)
    .replace(/[  ]/g, NBSP);
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
