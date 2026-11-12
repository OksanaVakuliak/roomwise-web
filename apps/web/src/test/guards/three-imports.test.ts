import { readFileSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SRC, walk } from './scanned-dirs';

const ENGINE = resolve(SRC, 'lib/room-3d/engine');
const ENGINE_ALIAS = '@/lib/room-3d/engine';
const STATIC_SPECIFIER =
  /(?:\bfrom|\bimport(?!\s*\()|\brequire\s*\(|\bmock\s*\()\s*\(?\s*['"]([^'"\n]+)['"]/g;
const DYNAMIC_SPECIFIER =
  /\b(?:import|importActual|importMock|doMock)\s*\(\s*['"]([^'"\n]+)['"]/g;
const TYPE_ONLY_STATEMENT =
  /\b(?:import|export)\s+type\b[^;'"]*?\bfrom\s*['"][^'"\n]+['"]/g;
const SCANNED_FILE = /\.(?:[cm]?[jt]s|[jt]sx)$/;

type Hit = { index: number; line: number; value: string };

function isInsideEngine(file: string): boolean {
  return file.startsWith(ENGINE + sep);
}

function isThree(value: string): boolean {
  return value === 'three' || value.startsWith('three/');
}

function pointsToEngine(file: string, value: string): boolean {
  const target = value.startsWith('.') ? resolve(file, '..', value) : value;
  if (value.startsWith('.')) {
    return target === ENGINE || target.startsWith(ENGINE + sep);
  }
  return target === ENGINE_ALIAS || target.startsWith(`${ENGINE_ALIAS}/`);
}

function collect(text: string, pattern: RegExp): Hit[] {
  return [...text.matchAll(pattern)].map((match) => ({
    index: match.index,
    line: text.slice(0, match.index).split('\n').length,
    value: match[1],
  }));
}

export function findViolations(file: string, text: string): string[] {
  const name = relative(SRC, file);
  const typeOnly = [...text.matchAll(TYPE_ONLY_STATEMENT)].map((match) => [
    match.index,
    match.index + match[0].length,
  ]);
  const isTypeOnly = (index: number) =>
    typeOnly.some(([start, end]) => index >= start && index < end);
  const hits = [
    ...collect(text, STATIC_SPECIFIER).map((hit) => ({
      ...hit,
      dynamic: false,
    })),
    ...collect(text, DYNAMIC_SPECIFIER).map((hit) => ({
      ...hit,
      dynamic: true,
    })),
  ];
  return hits.flatMap(({ index, line, value, dynamic }) => {
    if (isThree(value) && !isInsideEngine(file)) {
      return [
        `${name}:${line} imports '${value}', only lib/room-3d/engine may`,
      ];
    }
    if (
      pointsToEngine(file, value) &&
      !isInsideEngine(file) &&
      !dynamic &&
      !isTypeOnly(index)
    ) {
      return [
        `${name}:${line} imports '${value}' statically, engine must be loaded with import()`,
      ];
    }
    return [];
  });
}

describe('three imports', () => {
  it('only the engine imports three, and the engine is loaded dynamically', () => {
    const violations = walk(SRC)
      .filter((file) => SCANNED_FILE.test(file))
      .filter((file) => !file.endsWith(`${sep}three-imports.test.ts`))
      .flatMap((file) => findViolations(file, readFileSync(file, 'utf8')));
    expect(violations).toEqual([]);
  });

  describe('matcher', () => {
    const outside = resolve(SRC, 'features/configurator/interior/a.tsx');
    const inside = resolve(ENGINE, 'scene.ts');

    it('flags three imported outside the engine', () => {
      expect(
        findViolations(outside, "import * as THREE from 'three';"),
      ).toHaveLength(1);
      expect(
        findViolations(
          outside,
          "import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';",
        ),
      ).toHaveLength(1);
      expect(
        findViolations(outside, "const t = await import('three');"),
      ).toHaveLength(1);
      expect(
        findViolations(outside, "vi.mock('three', () => ({}));"),
      ).toHaveLength(1);
    });

    it('flags three loaded through vitest helpers', () => {
      for (const call of ['importActual', 'doMock', 'importMock']) {
        expect(
          findViolations(outside, `await vi.${call}('three');`),
        ).toHaveLength(1);
      }
    });

    it('allows three inside the engine', () => {
      expect(findViolations(inside, "import { Scene } from 'three';")).toEqual(
        [],
      );
    });

    it('ignores packages that merely start with three', () => {
      expect(findViolations(outside, "import x from 'three-stdlib';")).toEqual(
        [],
      );
    });

    it('flags static engine imports outside the engine', () => {
      expect(
        findViolations(
          outside,
          "import { mount } from '@/lib/room-3d/engine';",
        ),
      ).toHaveLength(1);
      expect(
        findViolations(
          resolve(SRC, 'lib/room-3d/use-scene.ts'),
          "import { mount } from './engine/scene';",
        ),
      ).toHaveLength(1);
    });

    it('allows dynamic engine imports outside the engine', () => {
      expect(
        findViolations(
          outside,
          "const m = await import('@/lib/room-3d/engine');",
        ),
      ).toEqual([]);
      expect(
        findViolations(
          resolve(SRC, 'lib/room-3d/use-scene.ts'),
          "const m = await import('./engine/scene');",
        ),
      ).toEqual([]);
    });

    it('allows type-only engine imports outside the engine', () => {
      expect(
        findViolations(
          outside,
          "import type { SceneHandle } from '@/lib/room-3d/engine';",
        ),
      ).toEqual([]);
      expect(
        findViolations(
          resolve(SRC, 'lib/room-3d/use-scene.ts'),
          "import type {\n  A,\n  B,\n} from './engine/scene';",
        ),
      ).toEqual([]);
      expect(
        findViolations(
          outside,
          "import type { A } from '@/lib/room-3d/engine';\nimport { b } from '@/lib/room-3d/engine';",
        ),
      ).toHaveLength(1);
    });

    it('scans every script extension', () => {
      for (const name of [
        'a.ts',
        'a.tsx',
        'a.mts',
        'a.cts',
        'a.js',
        'a.jsx',
        'a.mjs',
      ]) {
        expect(SCANNED_FILE.test(name)).toBe(true);
      }
      expect(SCANNED_FILE.test('a.css')).toBe(false);
    });

    it('lets engine files import each other statically', () => {
      expect(findViolations(inside, "import { a } from './helpers';")).toEqual(
        [],
      );
    });
  });
});
