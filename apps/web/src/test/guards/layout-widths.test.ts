import { readdirSync, readFileSync, statSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { VIEWPORTS } from '../viewports';

const SRC = resolve(import.meta.dirname, '../..');
const SMALLEST = Math.min(...VIEWPORTS);
const TABLET = 768;
const WIDTH_PROPERTIES = new Set([
  'width',
  'min-width',
  'flex-basis',
  'grid-template-columns',
]);

type Declaration = {
  file: string;
  line: number;
  selector: string;
  property: string;
  value: string;
  minWidth: number;
};

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = resolve(dir, name);
    if (name === 'node_modules') return [];
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

function rel(file: string): string {
  return relative(SRC, file).replaceAll('\\', '/');
}

function blankOutComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, (match) =>
    match.replace(/[^\n]/g, ' '),
  );
}

function readTokens(): Map<string, string> {
  const css = blankOutComments(
    readFileSync(resolve(SRC, 'styles/tokens.css'), 'utf8'),
  );
  const tokens = new Map<string, string>();
  for (const match of css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    if (!tokens.has(match[1])) tokens.set(match[1], match[2].trim());
  }
  return tokens;
}

const TOKENS = readTokens();

function resolveVars(value: string, depth = 0): string {
  if (depth > 5) return value;
  const next = value.replace(
    /var\(\s*(--[\w-]+)\s*(?:,[^)]*)?\)/g,
    (whole, name: string) => TOKENS.get(name) ?? whole,
  );
  return next === value ? value : resolveVars(next, depth + 1);
}

function parseDeclarations(file: string): Declaration[] {
  const css = blankOutComments(readFileSync(file, 'utf8'));
  const result: Declaration[] = [];
  const stack: { prelude: string; minWidth: number }[] = [];
  let buffer = '';
  let line = 1;
  let startLine = 1;

  for (const char of css) {
    if (char === '\n') line += 1;
    if (char === '{') {
      const prelude = buffer.trim();
      const bound =
        /^@media[^{]*\(\s*min-width\s*:\s*(\d+(?:\.\d+)?)px\s*\)/.exec(prelude);
      stack.push({ prelude, minWidth: bound ? Number(bound[1]) : 0 });
      buffer = '';
      startLine = line;
    } else if (char === '}') {
      stack.pop();
      buffer = '';
      startLine = line;
    } else if (char === ';') {
      const colon = buffer.indexOf(':');
      if (colon > 0 && stack.length > 0) {
        const selector =
          stack.filter((frame) => !frame.prelude.startsWith('@')).at(-1)
            ?.prelude ?? '';
        result.push({
          file,
          line: startLine,
          selector,
          property: buffer.slice(0, colon).trim(),
          value: buffer.slice(colon + 1).trim(),
          minWidth: stack.reduce(
            (max, frame) => Math.max(max, frame.minWidth),
            0,
          ),
        });
      }
      buffer = '';
      startLine = line;
    } else {
      if (buffer.trim() === '') startLine = line;
      buffer += char;
    }
  }
  return result;
}

function isProduction(file: string): boolean {
  const path = rel(file);
  return path.endsWith('.module.css') && !path.includes('/(dev)/');
}

function fixedPixels(value: string): number[] {
  const withoutFluid = value.replace(
    /(?:minmax|repeat)\([^()]*\b(?:auto-fill|auto-fit)\b[^()]*\)/g,
    '',
  );
  return [...withoutFluid.matchAll(/(?<![\w.-])(\d+(?:\.\d+)?)px\b/g)].map(
    (match) => Number(match[1]),
  );
}

function scrollsHorizontally(file: string): boolean {
  return /overflow-x\s*:\s*(?:auto|scroll)/.test(readFileSync(file, 'utf8'));
}

function sum(numbers: number[]): number {
  return numbers.reduce((total, number) => total + number, 0);
}

function describeDeclaration(item: Declaration): string {
  return `${rel(item.file)}:${item.line}: ${item.selector} { ${item.property}: ${item.value} }`;
}

describe('layout widths guard', () => {
  const files = walk(SRC).filter(isProduction);
  const declarations = files.flatMap(parseDeclarations);
  const stepLayout = declarations.filter((item) =>
    rel(item.file).includes('StepLayout'),
  );

  it('finds production css to check', () => {
    expect(files.length).toBeGreaterThan(0);
    expect(declarations.length).toBeGreaterThan(0);
    expect(stepLayout.length).toBeGreaterThan(0);
  });

  it('defines the layout tokens it relies on', () => {
    for (const name of [
      '--layout-aside-width',
      '--layout-aside-width-tablet',
      '--layout-scene-width',
      '--layout-cost-reserve',
    ]) {
      expect(TOKENS.get(name), name).toMatch(/^\d+px$/);
    }
  });

  it('never sizes anything by the viewport width', () => {
    const offenders = declarations
      .filter((item) => WIDTH_PROPERTIES.has(item.property))
      .filter((item) => /\d\s*vw\b/.test(resolveVars(item.value)));
    expect(offenders.map(describeDeclaration)).toEqual([]);
  });

  it('keeps fixed widths within the smallest viewport unless a min-width query admits them', () => {
    const offenders = declarations
      .filter((item) => WIDTH_PROPERTIES.has(item.property))
      .filter((item) => !scrollsHorizontally(item.file))
      .filter((item) => {
        const budget = item.minWidth === 0 ? SMALLEST : item.minWidth;
        return sum(fixedPixels(resolveVars(item.value))) > budget;
      });
    expect(offenders.map(describeDeclaration)).toEqual([]);
  });

  it('leaves the fluid column of a fixed-plus-fluid grid at least half the breakpoint', () => {
    const grids = declarations.filter(
      (item) =>
        item.property === 'grid-template-columns' &&
        item.minWidth > 0 &&
        fixedPixels(resolveVars(item.value)).length > 0,
    );
    expect(grids.length).toBeGreaterThan(0);
    const tight = grids.filter(
      (item) => sum(fixedPixels(resolveVars(item.value))) > item.minWidth / 2,
    );
    expect(tight.map(describeDeclaration)).toEqual([]);
  });

  it('allows no negative margins that push content out of the viewport', () => {
    const offenders = declarations
      .filter((item) => item.property.startsWith('margin'))
      .filter((item) => !item.value.includes('--stroke-'))
      .filter((item) => /(?<![\w.])-\d/.test(resolveVars(item.value)));
    expect(offenders.map(describeDeclaration)).toEqual([]);
  });

  it('fixes the cost panel to the viewport only below the tablet breakpoint', () => {
    const fixed = stepLayout.filter(
      (item) => item.property === 'position' && item.value === 'fixed',
    );
    expect(fixed).toHaveLength(1);
    expect(fixed[0].selector).toBe('.cost');
    expect(fixed[0].minWidth).toBe(0);

    const released = stepLayout.filter(
      (item) =>
        item.selector === '.cost' &&
        item.property === 'position' &&
        item.value === 'sticky' &&
        item.minWidth === TABLET,
    );
    expect(released).toHaveLength(1);
  });

  it('reserves room under the whole page, footer included, for the fixed cost panel', () => {
    const reserve = stepLayout.find(
      (item) =>
        item.selector === ':global(body):has(.cost)' &&
        item.minWidth === 0 &&
        item.property === 'padding-bottom' &&
        item.value.includes('var(--layout-cost-reserve)'),
    );
    expect(reserve).toBeDefined();
  });

  it('scales text with the root font size so 200% zoom works', () => {
    const sizeTokens = [...TOKENS].filter(
      ([name]) =>
        /^--[\w-]*size$/.test(name) && /^--(?:text|tape|cut)-/.test(name),
    );
    expect(sizeTokens.length).toBeGreaterThan(0);
    const fixedTokens = sizeTokens.filter(([, value]) =>
      /\d(?:px|pt)\b/.test(value),
    );
    expect(fixedTokens.map(([name, value]) => `${name}: ${value}`)).toEqual([]);

    const offenders = declarations
      .filter((item) => item.property === 'font-size')
      .filter((item) => /\d(?:px|vw|vh|pt)\b/.test(resolveVars(item.value)));
    expect(offenders.map(describeDeclaration)).toEqual([]);
  });

  it('does not clip layout boxes to a fixed pixel height', () => {
    const offenders = declarations
      .filter((item) => rel(item.file).startsWith('components/layout/'))
      .filter(
        (item) => item.property === 'height' || item.property === 'max-height',
      )
      .filter((item) => /\d+px\b/.test(resolveVars(item.value)));
    expect(offenders.map(describeDeclaration)).toEqual([]);
  });
});
