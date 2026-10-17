import { describe, expect, it } from 'vitest';
import { area, currencies, dimension, money, percent } from './index';

const NBSP = '\u00a0';

const plain = (value: string) => value.replace(/[\u00a0\u202f]/g, ' ');

describe('money', () => {
  const rate = { uahPerUsd: 41.2345 };

  it('formats USD cents in en', () => {
    expect(money(123456789, 'USD', 'en')).toBe('$1,234,567.89');
    expect(money(150000, 'USD', 'en')).toBe('$1,500');
    expect(money(1250, 'USD', 'en')).toBe('$12.50');
  });

  it('formats USD cents in uk', () => {
    const out = money(123456789, 'USD', 'uk');
    expect(plain(out)).toBe('1 234 567,89 USD');
    expect(out).not.toContain('.');
  });

  it('formats UAH with the exchange rate in whole hryvnias', () => {
    expect(plain(money(100000, 'UAH', 'en', rate))).toBe('UAH 41,235');
    expect(plain(money(100000, 'UAH', 'uk', rate))).toBe('41 235 ₴');
  });

  it('separates uk thousands with a no-break space', () => {
    const out = money(123456700, 'USD', 'uk');
    expect(out).toMatch(/^1[\u00a0\u202f]234[\u00a0\u202f]567/);
  });

  it('handles zero', () => {
    expect(money(0, 'USD', 'en')).toBe('$0');
    expect(plain(money(0, 'UAH', 'en', rate))).toBe('UAH 0');
  });

  it('handles negative amounts', () => {
    expect(money(-1250, 'USD', 'en')).toBe('-$12.50');
    expect(plain(money(-1250, 'USD', 'uk'))).toBe('-12,50 USD');
    expect(plain(money(-100000, 'UAH', 'en', rate))).toBe('-UAH 41,235');
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
