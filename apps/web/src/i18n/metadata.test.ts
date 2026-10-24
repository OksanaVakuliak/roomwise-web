import { describe, expect, it } from 'vitest';
import { localeAlternates } from './metadata';

describe('localeAlternates', () => {
  it('builds the home alternates without a trailing slash', () => {
    expect(localeAlternates('uk')).toEqual({
      canonical: '/uk',
      languages: { en: '/en', uk: '/uk', 'x-default': '/' },
    });
  });

  it('keeps the current locale in the canonical and points x-default at the unprefixed path', () => {
    expect(localeAlternates('uk', '/configurator')).toEqual({
      canonical: '/uk/configurator',
      languages: {
        en: '/en/configurator',
        uk: '/uk/configurator',
        'x-default': '/configurator',
      },
    });
    expect(localeAlternates('en', '/configurator').canonical).toBe(
      '/en/configurator',
    );
  });
});
