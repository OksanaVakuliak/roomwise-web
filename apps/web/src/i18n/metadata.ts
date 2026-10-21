import type { Metadata } from 'next';
import { routing } from './routing';

export function localeAlternates(
  locale: string,
  path = '',
): NonNullable<Metadata['alternates']> {
  const languages: Record<string, string> = Object.fromEntries(
    routing.locales.map((entry) => [entry, `/${entry}${path}`]),
  );

  languages['x-default'] = `/${routing.defaultLocale}${path}`;

  return { canonical: `/${locale}${path}`, languages };
}
