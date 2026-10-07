import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

type Rgba = { r: number; g: number; b: number; a: number };
type Kind = 'text' | 'large' | 'non-text';
type Pair = { fg: string; bg: string; kind: Kind };

const THEMES = ['light', 'dark'] as const;

const MINIMUM: Record<Kind, number> = {
  text: 4.5,
  large: 3,
  'non-text': 3,
};

const PAIRS: Pair[] = [
  { fg: 'line', bg: 'sheet', kind: 'text' },
  { fg: 'line-2', bg: 'sheet', kind: 'text' },
  { fg: 'heat', bg: 'sheet', kind: 'text' },
  { fg: 'on-heat', bg: 'heat', kind: 'text' },
  { fg: 'tape-ink', bg: 'tape', kind: 'text' },
  { fg: 'sheet', bg: 'line', kind: 'text' },
  { fg: 'pencil', bg: 'sheet', kind: 'large' },
  { fg: 'line', bg: 'sheet', kind: 'non-text' },
  { fg: 'line', bg: 'paper', kind: 'non-text' },
  { fg: 'line', bg: 'fill-a', kind: 'non-text' },
  { fg: 'line-2', bg: 'sheet', kind: 'non-text' },
  { fg: 'heat', bg: 'sheet', kind: 'non-text' },
  { fg: 'sheet', bg: 'heat', kind: 'non-text' },
];

const tokensCss = readFileSync(
  resolve(import.meta.dirname, '../../styles/tokens.css'),
  'utf8',
);

function parseColor(value: string): Rgba {
  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const digits =
      hex[1].length === 3
        ? [...hex[1]].map((digit) => digit + digit).join('')
        : hex[1];
    return {
      r: Number.parseInt(digits.slice(0, 2), 16),
      g: Number.parseInt(digits.slice(2, 4), 16),
      b: Number.parseInt(digits.slice(4, 6), 16),
      a: 1,
    };
  }
  const rgba = value.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i,
  );
  if (rgba) {
    return {
      r: Number(rgba[1]),
      g: Number(rgba[2]),
      b: Number(rgba[3]),
      a: rgba[4] === undefined ? 1 : Number(rgba[4]),
    };
  }
  throw new Error(`Unsupported colour value: ${value}`);
}

function parseTheme(theme: string): Record<string, Rgba> {
  const block = tokensCss.match(
    new RegExp(String.raw`:root\[data-theme="${theme}"\]\s*\{([^}]*)\}`),
  );
  if (!block) {
    throw new Error(`Theme block not found: ${theme}`);
  }
  const roles: Record<string, Rgba> = {};
  for (const [, name, value] of block[1].matchAll(
    /--([a-z0-9-]+)\s*:\s*([^;]+);/g,
  )) {
    if (name !== 'color-scheme') {
      roles[name] = parseColor(value.trim());
    }
  }
  return roles;
}

function composite(top: Rgba, base: Rgba): Rgba {
  const a = top.a + base.a * (1 - top.a);
  const channel = (t: number, b: number) =>
    (t * top.a + b * base.a * (1 - top.a)) / a;
  return {
    r: channel(top.r, base.r),
    g: channel(top.g, base.g),
    b: channel(top.b, base.b),
    a,
  };
}

function luminance({ r, g, b }: Rgba): number {
  const linear = (value: number) => {
    const s = value / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

function contrast(foreground: Rgba, background: Rgba): number {
  const [light, dark] = [luminance(foreground), luminance(background)].sort(
    (x, y) => y - x,
  );
  return (light + 0.05) / (dark + 0.05);
}

function measure(roles: Record<string, Rgba>, pair: Pair): number {
  const canvas = roles.sheet;
  const background = composite(roles[pair.bg], canvas);
  const foreground = composite(roles[pair.fg], background);
  return contrast(foreground, background);
}

describe.each(THEMES)('contrast in %s theme', (theme) => {
  const roles = parseTheme(theme);

  it('defines every role used by the pairs', () => {
    for (const pair of PAIRS) {
      expect(roles[pair.fg], pair.fg).toBeDefined();
      expect(roles[pair.bg], pair.bg).toBeDefined();
    }
  });

  it.each(PAIRS)('$fg on $bg ($kind)', (pair) => {
    const ratio = measure(roles, pair);
    expect(
      ratio,
      `${theme}: ${pair.fg} on ${pair.bg} is ${ratio.toFixed(2)}:1, needs ${MINIMUM[pair.kind]}:1`,
    ).toBeGreaterThanOrEqual(MINIMUM[pair.kind]);
  });
});
