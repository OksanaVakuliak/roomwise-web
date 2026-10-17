import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const webRoot = resolve(import.meta.dirname, '../../..');
const SOURCE_DIRS = ['src/app', 'src/components'];
const ATTRIBUTES = ['alt', 'title', 'placeholder', 'aria-label', 'label'];

type Catalog = { [key: string]: string | Catalog };
type Hit = { line: number; text: string };

function readCatalog(locale: string): Catalog {
  return JSON.parse(
    readFileSync(resolve(webRoot, 'messages', `${locale}.json`), 'utf8'),
  );
}

function flatten(catalog: Catalog, prefix = ''): Map<string, unknown> {
  const out = new Map<string, unknown>();
  for (const [key, value] of Object.entries(catalog)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object') {
      for (const [k, v] of flatten(value, path)) out.set(k, v);
    } else {
      out.set(path, value);
    }
  }
  return out;
}

function collectFiles(dir: string): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  return entries.flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return collectFiles(full);
    return full.endsWith('.tsx') && !full.endsWith('.test.tsx') ? [full] : [];
  });
}

function blank(match: string): string {
  return match.replace(/[^\n]/g, ' ');
}

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(
      /(^|[^:'"`\\])(\/\/[^\n]*)/g,
      (_match, lead: string, comment: string) => lead + blank(comment),
    );
}

function lineOf(source: string, index: number): number {
  return source.slice(0, index).split('\n').length;
}

function findLiterals(source: string): Hit[] {
  const code = stripComments(source);
  const hits: Hit[] = [];

  for (const m of code.matchAll(
    /(<\/?[A-Za-z][\w.:-]*(?:\s[^<>]*)?>|<>)([^<>{}]+)(?=<)/g,
  )) {
    const text = m[2];
    if (/\p{L}/u.test(text)) {
      const lead = text.length - text.trimStart().length;
      hits.push({
        line: lineOf(code, (m.index ?? 0) + m[1].length + lead),
        text: text.trim(),
      });
    }
  }

  const attribute = new RegExp(
    `\\s(?:${ATTRIBUTES.join('|')})\\s*=\\s*(?:"([^"]*)"|'([^']*)'|\\{\\s*(?:"([^"]*)"|'([^']*)'|\`([^\`$]*)\`)\\s*\\})`,
    'g',
  );
  for (const m of code.matchAll(attribute)) {
    const text = m[1] ?? m[2] ?? m[3] ?? m[4] ?? m[5] ?? '';
    if (/\p{L}/u.test(text)) {
      hits.push({ line: lineOf(code, m.index ?? 0), text });
    }
  }

  return hits;
}

describe('message catalogs', () => {
  const en = flatten(readCatalog('en'));
  const uk = flatten(readCatalog('uk'));

  it('have the same keys in en and uk', () => {
    const missingInUk = [...en.keys()].filter((k) => !uk.has(k));
    const missingInEn = [...uk.keys()].filter((k) => !en.has(k));
    expect({ missingInUk, missingInEn }).toEqual({
      missingInUk: [],
      missingInEn: [],
    });
  });

  it.each([
    ['en', en],
    ['uk', uk],
  ])('have no empty values in %s', (_locale, catalog) => {
    const empty = [...catalog.entries()]
      .filter(([, v]) => typeof v !== 'string' || v.trim() === '')
      .map(([k]) => k);
    expect(empty).toEqual([]);
  });
});

describe('user-facing text', () => {
  it('has no hardcoded literals in app and components', () => {
    const report = SOURCE_DIRS.flatMap((dir) =>
      collectFiles(resolve(webRoot, dir)).flatMap((file) =>
        findLiterals(readFileSync(file, 'utf8')).map(({ line, text }) => {
          const rel = file.slice(webRoot.length + 1).replaceAll('\\', '/');
          return `${rel}:${line} "${text}"`;
        }),
      ),
    );
    expect(report).toEqual([]);
  });
});
