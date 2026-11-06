import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SCANNED_DIRS, SRC, walk } from './scanned-dirs';

const CLIENT_ONLY =
  /\b(?:useState|useEffect|useLayoutEffect|useInsertionEffect|useReducer|useRef|useContext|createContext|useSyncExternalStore|useTransition|useOptimistic|useActionState|useImperativeHandle)\b/;
const DIRECTIVE = /^\s*['"]use client['"];?/;

describe('client directive', () => {
  it('marks every component that uses a client-only React API', () => {
    const missing = SCANNED_DIRS.flatMap(walk)
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
