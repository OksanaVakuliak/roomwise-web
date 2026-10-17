import { readdirSync, readFileSync, statSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = resolve(import.meta.dirname, '../..');
const COMPONENTS = resolve(SRC, 'components');

const COLOR_FUNCTION = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/i;
const HEX_COLOR = /#[0-9a-f]{3,8}\b/i;
const LENGTH =
  /(?<![\w.#-])(-?(?:\d+\.?\d*|\.\d+))(px|rem|em|vh|vw|vmin|vmax|svh|dvh|lvh|ch|ex|cm|mm|in|pt|pc|cqw|cqh|fr)\b|(?<![\w.#-])(-?(?:\d+\.?\d*|\.\d+))%/gi;
const NAMED_COLORS = new Set(
  'aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen'.split(
    ' ',
  ),
);

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = resolve(dir, name);
    if (name === 'node_modules') return [];
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

function blankOutComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, (match) =>
    match.replace(/[^\n]/g, ' '),
  );
}

function stripVarCalls(value: string): string {
  let result = value;
  let previous: string;
  do {
    previous = result;
    result = result.replace(/var\([^()]*\)/g, '');
  } while (result !== previous);
  return result;
}

function isAllowedLength(amount: string, unit: string | undefined): boolean {
  const number = Number.parseFloat(amount);
  if (number === 0) return true;
  if (unit === undefined) return number === 100;
  return unit.toLowerCase() === 'px' && number === 1;
}

function literalProblems(text: string): string[] {
  const problems: string[] = [];
  const bare = stripVarCalls(text)
    .replace(/"[^"]*"|'[^']*'/g, '')
    .replace(/^[a-z-]+\s*:/i, '');
  if (HEX_COLOR.test(bare) || COLOR_FUNCTION.test(bare)) {
    problems.push('literal color');
  }
  const named = (bare.match(/[a-z-]+/gi) ?? []).find((word) =>
    NAMED_COLORS.has(word.toLowerCase()),
  );
  if (named) problems.push(`named color "${named}"`);
  for (const match of bare.matchAll(LENGTH)) {
    if (!isAllowedLength(match[1] ?? match[3], match[2])) {
      problems.push(`literal length "${match[0]}"`);
    }
  }
  return problems;
}

function scan(file: string): string[] {
  const lines = blankOutComments(readFileSync(file, 'utf8')).split('\n');
  return lines.flatMap((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.includes('{') || trimmed.startsWith('@')) return [];
    return literalProblems(trimmed).map(
      (problem) =>
        `${relative(SRC, file).replaceAll('\\', '/')}:${index + 1}: ${trimmed} (${problem})`,
    );
  });
}

describe('component css uses tokens only', () => {
  const files = walk(COMPONENTS).filter((file) => file.endsWith('.module.css'));

  it('finds css modules to check', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('has no literal colors or lengths', () => {
    expect(files.flatMap(scan)).toEqual([]);
  });
});
