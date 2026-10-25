import { convertCentsToKopecks } from '@roomwise/calc-engine';
import { describe, expect, it } from 'vitest';
import {
  area,
  currencies,
  dimension,
  money,
  moneyMinor,
  percent,
  rateDate,
  rateValue,
  unitPrice,
} from './index';

const NBSP = '\u00a0';

const plain = (value: string) => value.replace(/[\u00a0\u202f]/g, ' ');

describe('money', () => {
  const rate = { uahPerUsd: 41.2345 };

  it('formats USD cents in en', () => {
    expect(money(123456789, 'USD', 'en')).toBe('$1,234,567.89');
    expect(money(150000, 'USD', 'en')).toBe('$1,500');
    expect(money(1250, 'USD', 'en')).toBe('$12.50');
  });

  it('formats USD cents in uk with the dollar sign first', () => {
    expect(plain(money(123456789, 'USD', 'uk'))).toBe('$1 234 567,89');
    expect(money(22578, 'USD', 'uk')).toBe('$225,78');
  });

  it('formats UAH with the exchange rate in whole hryvnias', () => {
    expect(money(100000, 'UAH', 'en', rate)).toBe(`41,235${NBSP}₴`);
    expect(money(100000, 'UAH', 'uk', rate)).toBe(`41${NBSP}235${NBSP}₴`);
  });

  it('does not keep a minus sign on amounts that round to zero', () => {
    expect(money(-1, 'UAH', 'en', { uahPerUsd: 1 })).toBe(`0${NBSP}₴`);
    expect(money(-0.4, 'USD', 'en')).toBe('$0');
    expect(money(-0.4, 'UAH', 'uk', rate)).toBe(`0${NBSP}₴`);
  });

  it('separates uk thousands with a no-break space only', () => {
    expect(money(123456700, 'USD', 'uk')).toBe(`$1${NBSP}234${NBSP}567`);
  });

  it('handles zero', () => {
    expect(money(0, 'USD', 'en')).toBe('$0');
    expect(money(0, 'UAH', 'en', rate)).toBe(`0${NBSP}₴`);
  });

  it('handles negative amounts', () => {
    expect(money(-1250, 'USD', 'en')).toBe('-$12.50');
    expect(money(-1250, 'USD', 'uk')).toBe('-$12,50');
    expect(money(-100000, 'UAH', 'en', rate)).toBe(`-41,235${NBSP}₴`);
  });

  it('throws for UAH without a rate', () => {
    expect(() => money(100, 'UAH', 'en')).toThrow(
      'UAH requires an exchange rate',
    );
  });

  it('does not require a rate for USD', () => {
    expect(() => money(100, 'USD', 'uk')).not.toThrow();
  });
});

describe('area', () => {
  it('appends the localized unit after a no-break space', () => {
    expect(area(12.5, 'en')).toBe(`12.5${NBSP}m²`);
    expect(area(12.5, 'uk')).toBe(`12,5${NBSP}м²`);
  });

  it('limits to two fraction digits', () => {
    expect(area(12.3456, 'en')).toBe(`12.35${NBSP}m²`);
  });

  it('formats zero and negative values', () => {
    expect(area(0, 'en')).toBe(`0${NBSP}m²`);
    expect(area(-3, 'uk')).toBe(`-3${NBSP}м²`);
  });
});

describe('dimension', () => {
  it('appends the localized unit after a no-break space', () => {
    expect(dimension(2.7, 'en')).toBe(`2.7${NBSP}m`);
    expect(dimension(2.7, 'uk')).toBe(`2,7${NBSP}м`);
  });

  it('limits to two fraction digits', () => {
    expect(dimension(3.456, 'uk')).toBe(`3,46${NBSP}м`);
  });
});

describe('percent', () => {
  it('keeps one fraction digit', () => {
    expect(percent(0.155, 'en')).toBe('15.5%');
    expect(plain(percent(0.155, 'uk'))).toBe('15,5%');
  });

  it('formats zero and whole percents', () => {
    expect(percent(0, 'en')).toBe('0%');
    expect(percent(1, 'en')).toBe('100%');
  });
});

describe('currencies', () => {
  it('lists the supported currencies', () => {
    expect(currencies).toEqual(['USD', 'UAH']);
  });
});

describe('rate formatting', () => {
  it('formats the rate with two decimals per locale', () => {
    expect(plain(rateValue(41.5, 'en'))).toBe('41.50');
    expect(plain(rateValue(41.5, 'uk'))).toBe('41,50');
  });

  it('formats the rate date per locale without a timezone shift', () => {
    expect(rateDate('2026-10-01', 'en')).toBe('1 Oct 2026');
    expect(rateDate('2026-10-01', 'uk')).toBe('01.10.2026');
  });
});

describe('moneyMinor', () => {
  it('formats USD cents with two digits only when fractional', () => {
    expect(moneyMinor(1250, 'USD', 'en')).toBe('$12.50');
    expect(moneyMinor(150000, 'USD', 'en')).toBe('$1,500');
    expect(moneyMinor(22578, 'USD', 'uk')).toBe('$225,78');
    expect(plain(moneyMinor(123456789, 'USD', 'uk'))).toBe('$1 234 567,89');
  });

  it('formats UAH kopecks with the hryvnia sign last', () => {
    expect(moneyMinor(123456, 'UAH', 'en')).toBe(`1,234.56${NBSP}₴`);
    expect(moneyMinor(123400, 'UAH', 'en')).toBe(`1,234${NBSP}₴`);
    expect(moneyMinor(123456, 'UAH', 'uk')).toBe(`1${NBSP}234,56${NBSP}₴`);
    expect(moneyMinor(123400, 'UAH', 'uk')).toBe(`1${NBSP}234${NBSP}₴`);
  });

  it('handles zero and negative amounts', () => {
    expect(moneyMinor(0, 'USD', 'en')).toBe('$0');
    expect(moneyMinor(0, 'UAH', 'uk')).toBe(`0${NBSP}₴`);
    expect(moneyMinor(-1250, 'USD', 'en')).toBe('-$12.50');
    expect(moneyMinor(-5050, 'UAH', 'en')).toBe(`-50.50${NBSP}₴`);
  });
});

describe('unitPrice', () => {
  const rate = { uahPerUsd: 41.2345 };

  it('prints USD cents as they are', () => {
    expect(unitPrice(1250, 'USD', 'en')).toBe('$12.50');
    expect(unitPrice(1250, 'USD', 'uk')).toBe('$12,50');
  });

  it('converts to kopecks through the engine', () => {
    expect(unitPrice(1250, 'UAH', 'en', rate)).toBe(
      moneyMinor(convertCentsToKopecks(1250, rate.uahPerUsd), 'UAH', 'en'),
    );
    expect(unitPrice(1000, 'UAH', 'uk', rate)).toBe(`412,35${NBSP}₴`);
  });

  it('throws for UAH without a rate', () => {
    expect(() => unitPrice(100, 'UAH', 'en')).toThrow(
      'UAH requires an exchange rate',
    );
  });
});
