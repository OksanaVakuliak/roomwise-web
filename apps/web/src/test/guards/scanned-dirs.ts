import { existsSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

export const SRC = resolve(import.meta.dirname, '../..');

const inSrc = (dirs: string[]) => dirs.map((dir) => resolve(SRC, dir));

export const SCANNED_DIRS = inSrc(['components', 'app', 'features']);

export const TOKEN_DIRS = inSrc(['components', 'features']);

export function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const full = resolve(dir, name);
    if (name === 'node_modules') return [];
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}
