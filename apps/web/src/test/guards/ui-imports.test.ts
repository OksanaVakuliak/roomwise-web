import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = resolve(import.meta.dirname, '../..');
const UI = resolve(SRC, 'components/ui');
const ALIAS = '@/components/ui';
const INDEX_LINE = /^export \* from '\.\/([A-Za-z0-9]+)\/([A-Za-z0-9]+)';$/;
const SPECIFIER =
  /(?:\bfrom|\bimport|\bmock|\brequire)\s*\(?\s*['"]([^'"\n]+)['"]/g;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = resolve(dir, name);
    if (name === 'node_modules') return [];
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

function isInside(dir: string, file: string): boolean {
  return file.startsWith(dir + sep);
}

function stripExtension(path: string): string {
  return path.replace(/\.(module\.css|tsx?|css)$/, '');
}

function specifiers(file: string): { line: number; value: string }[] {
  const text = readFileSync(file, 'utf8');
  return [...text.matchAll(SPECIFIER)].map((match) => ({
    line: text.slice(0, match.index).split('\n').length,
    value: match[1],
  }));
}

function resolveInsideUi(file: string, value: string): string | null {
  let target: string | null = null;
  if (value === ALIAS || value.startsWith(`${ALIAS}/`)) {
    target = resolve(UI, value.slice(ALIAS.length + 1));
  } else if (value.startsWith('.')) {
    target = resolve(file, '..', value);
  }
  if (target === null) return null;
  return target === UI || isInside(UI, target) ? target : null;
}

function outsideViolations(file: string): string[] {
  return specifiers(file).flatMap(({ line, value }) => {
    const target = resolveInsideUi(file, value);
    if (target === null) return [];
    const isIndex =
      target === UI || stripExtension(target) === `${UI}${sep}index`;
    if (isIndex) return [];
    return [
      `${relative(SRC, file)}:${line} imports '${value}', import from '${ALIAS}' instead`,
    ];
  });
}

function insideViolations(file: string): string[] {
  const folder = relative(UI, file).split(sep)[0];
  return specifiers(file).flatMap(({ line, value }) => {
    const target = resolveInsideUi(file, value);
    if (target === null) return [];
    const parts = relative(UI, stripExtension(target)).split(sep);
    const own = parts[0] === folder;
    const sibling = parts.length === 2 && parts[0] === parts[1];
    if (own || sibling) return [];
    return [
      `${relative(SRC, file)}:${line} imports '${value}', siblings must be imported as '../<Name>/<Name>', never through the index`,
    ];
  });
}

describe('ui library imports', () => {
  const files = walk(SRC).filter((file) => /\.tsx?$/.test(file));

  it('consumers import only from @/components/ui', () => {
    const violations = files
      .filter((file) => !isInside(UI, file))
      .flatMap(outsideViolations);
    expect(violations).toEqual([]);
  });

  it('library files import siblings only as ../<Name>/<Name>', () => {
    const violations = files
      .filter((file) => isInside(UI, file) && relative(UI, file) !== 'index.ts')
      .flatMap(insideViolations);
    expect(violations).toEqual([]);
  });

  it('index.ts lists every component folder exactly once, alphabetically', () => {
    const folders = readdirSync(UI)
      .filter((name) => statSync(resolve(UI, name)).isDirectory())
      .sort();
    const lines = readFileSync(resolve(UI, 'index.ts'), 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    const problems: string[] = [];
    const listed: string[] = [];

    for (const line of lines) {
      const match = line.match(INDEX_LINE);
      if (!match || match[1] !== match[2]) {
        problems.push(`index.ts: unexpected line "${line}"`);
        continue;
      }
      listed.push(match[1]);
      if (!folders.includes(match[1])) {
        problems.push(`index.ts references missing folder "${match[1]}"`);
      }
    }
    for (const folder of folders) {
      const count = listed.filter((name) => name === folder).length;
      if (count !== 1) {
        problems.push(`index.ts has ${count} lines for folder "${folder}"`);
      }
    }
    if (listed.join() !== [...listed].sort().join()) {
      problems.push('index.ts lines are not in alphabetical order');
    }
    expect(problems).toEqual([]);
  });

  it('every component folder has <Name>.tsx and <Name>.module.css', () => {
    const missing = readdirSync(UI)
      .filter((name) => statSync(resolve(UI, name)).isDirectory())
      .flatMap((name) =>
        [`${name}.tsx`, `${name}.module.css`]
          .filter((file) => !existsSync(resolve(UI, name, file)))
          .map((file) => `components/ui/${name}/${file} is missing`),
      );
    expect(missing).toEqual([]);
  });
});
