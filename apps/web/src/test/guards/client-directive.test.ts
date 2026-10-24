import { readdirSync, readFileSync, statSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = resolve(import.meta.dirname, '../..');
const DIRS = ['components', 'app'].map((dir) => resolve(SRC, dir));
const CLIENT_ONLY =
  /\b(?:useState|useEffect|useLayoutEffect|useInsertionEffect|useReducer|useRef|useContext|createContext|useSyncExternalStore|useTransition|useOptimistic|useActionState|useImperativeHandle)\b/;
const DIRECTIVE = /^\s*['"]use client['"];?/;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = resolve(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

describe('client directive', () => {
  it('marks every component that uses a client-only React API', () => {
    const missing = DIRS.flatMap(walk)
      .filter((file) => file.endsWith('.tsx') && !file.endsWith('.test.tsx'))
      .filter((file) => {
        const text = readFileSync(file, 'utf8');
        return CLIENT_ONLY.test(text) && !DIRECTIVE.test(text);
      })
      .map((file) => relative(SRC, file).replaceAll('\\', '/'));

    expect(missing).toEqual([]);
  });

  it('marks every module that creates a React context', () => {
    const missing = walk(SRC)
      .filter((file) => /\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file))
      .filter((file) => {
        const text = readFileSync(file, 'utf8');
        return /\bcreateContext\b/.test(text) && !DIRECTIVE.test(text);
      })
      .map((file) => relative(SRC, file).replaceAll('\\', '/'));

    expect(missing).toEqual([]);
  });
});
