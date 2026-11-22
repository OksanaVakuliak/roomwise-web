import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { NO_INNER_HTML_DIRS, SRC, walk } from './scanned-dirs';

const SCANNED_FILE = /\.(?:[cm]?[jt]s|[jt]sx)$/;
const INNER_HTML = /dangerouslySetInnerHTML/g;

export function findViolations(file: string, text: string): string[] {
  return [...text.matchAll(INNER_HTML)].map(
    (match) =>
      `${relative(SRC, file)}:${text.slice(0, match.index).split('\n').length} uses dangerouslySetInnerHTML`,
  );
}

describe('no inner html', () => {
  it('admin and ui components never use dangerouslySetInnerHTML', () => {
    const violations = NO_INNER_HTML_DIRS.flatMap(walk)
      .filter((file) => SCANNED_FILE.test(file))
      .filter((file) => !file.endsWith('no-inner-html.test.ts'))
      .flatMap((file) => findViolations(file, readFileSync(file, 'utf8')));
    expect(violations).toEqual([]);
  });

  describe('matcher', () => {
    it('flags the prop with its line', () => {
      expect(
        findViolations(
          '/x/a.tsx',
          'const a = 1;\n<div dangerouslySetInnerHTML={{ __html: h }} />',
        ),
      ).toHaveLength(1);
    });

    it('ignores clean code', () => {
      expect(findViolations('/x/a.tsx', '<div>{text}</div>')).toEqual([]);
    });
  });
});
