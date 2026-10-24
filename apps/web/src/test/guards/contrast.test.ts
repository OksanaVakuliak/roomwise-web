import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  MINIMUM,
  measure,
  PAIRS,
  parseTheme,
  THEMES,
} from '@/lib/contrast/contrast';

const tokensCss = readFileSync(
  resolve(import.meta.dirname, '../../styles/tokens.css'),
  'utf8',
);

describe.each(THEMES)('contrast in %s theme', (theme) => {
  const roles = parseTheme(tokensCss, theme);

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
