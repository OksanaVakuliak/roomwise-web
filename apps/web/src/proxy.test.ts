// @vitest-environment node
import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import proxy from './proxy';

function visit(path: string, headers: Record<string, string> = {}) {
  return proxy(new NextRequest(`http://localhost${path}`, { headers }));
}

function redirectPath(response: Response) {
  const location = response.headers.get('location');
  return location ? new URL(location).pathname : null;
}

describe('first-visit language', () => {
  it('opens Ukrainian for a Ukrainian browser', async () => {
    const response = await visit('/', { 'accept-language': 'uk-UA,uk;q=0.9' });

    expect(redirectPath(response)).toBe('/uk');
  });

  it('opens Ukrainian when Ukrainian follows an unsupported language', async () => {
    const response = await visit('/', { 'accept-language': 'ru,uk;q=0.8' });

    expect(redirectPath(response)).toBe('/uk');
  });

  it.each(['de', 'ru', 'ru-RU,ru;q=0.9', 'be', 'en-US', 'fr-FR,fr;q=0.9'])(
    'opens English for a browser asking for %s',
    async (acceptLanguage) => {
      const response = await visit('/', { 'accept-language': acceptLanguage });

      expect(redirectPath(response)).toBe('/en');
    },
  );

  it('opens English when the browser sends no language', async () => {
    expect(redirectPath(await visit('/'))).toBe('/en');
  });

  it('lets an explicit choice win over the browser language', async () => {
    const response = await visit('/', {
      'accept-language': 'uk-UA,uk;q=0.9',
      cookie: 'NEXT_LOCALE=en',
    });

    expect(redirectPath(response)).toBe('/en');
  });

  it('lets a stored Ukrainian choice win over an English browser', async () => {
    const response = await visit('/', {
      'accept-language': 'en-US,en;q=0.9',
      cookie: 'NEXT_LOCALE=uk',
    });

    expect(redirectPath(response)).toBe('/uk');
  });
});

describe('shared links', () => {
  it('opens a Ukrainian link in Ukrainian for an English browser', async () => {
    const response = await visit('/uk/configurator', {
      'accept-language': 'en-US,en;q=0.9',
    });

    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(
      response.headers.get('x-middleware-request-x-next-intl-locale'),
    ).toBe('uk');
  });

  it('opens an English link in English for a Ukrainian browser', async () => {
    const response = await visit('/en/configurator', {
      'accept-language': 'uk-UA,uk;q=0.9',
    });

    expect(response.headers.get('location')).toBeNull();
  });

  it('does not override the link language with a stored choice', async () => {
    const response = await visit('/uk/configurator', {
      cookie: 'NEXT_LOCALE=en',
    });

    expect(response.headers.get('location')).toBeNull();
  });
});
