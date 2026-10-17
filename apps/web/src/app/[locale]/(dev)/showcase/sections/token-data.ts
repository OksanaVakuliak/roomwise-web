import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CSSProperties } from 'react';
import {
  parseTheme,
  parseThemeValues,
  type Theme,
} from '@/lib/contrast/contrast';

const STYLES = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../../../styles',
);

function readStyles(file: string): string {
  return readFileSync(resolve(STYLES, file), 'utf8');
}

const tokensCss = readStyles('tokens.css');
const typographyCss = readStyles('typography.css');

function rootBlock(): string {
  const blocks = [...tokensCss.matchAll(/^:root\s*\{([^}]*)\}/gm)];
  return blocks.map((block) => block[1]).join('\n');
}

function collect(prefix: string): { name: string; value: string }[] {
  return [...rootBlock().matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/g)]
    .filter(([, name]) => name.startsWith(prefix))
    .map(([, name, value]) => ({ name: `--${name}`, value: value.trim() }));
}

export function themeColors(theme: Theme): { name: string; value: string }[] {
  return Object.entries(parseThemeValues(tokensCss, theme)).map(
    ([name, value]) => ({ name, value }),
  );
}

export function themeRoles(theme: Theme) {
  return parseTheme(tokensCss, theme);
}

export function themeStyle(theme: Theme): CSSProperties {
  const vars: Record<string, string> = {};
  for (const { name, value } of themeColors(theme)) {
    vars[`--${name}`] = value;
  }
  return vars as CSSProperties;
}

export const SPACING = collect('space-');
export const STROKES = collect('stroke-');
export const DURATIONS = collect('duration-');
export const EASINGS = collect('ease-');

export type TypeStyle = { name: string; className: string; size: string };

export const TYPE_STYLES: TypeStyle[] = [
  ...typographyCss.matchAll(/--text-([a-z-]+)-size:\s*([^;]+);/g),
]
  .filter(([, name]) => typographyCss.includes(`.text-${name} {`))
  .map(([, name, size]) => ({
    name,
    className: `text-${name}`,
    size: size.trim(),
  }));
