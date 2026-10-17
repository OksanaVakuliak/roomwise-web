import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const SRC = resolve(import.meta.dirname, '../..');
const REDUCED_MOTION =
  /^@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)$/;

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

type ImportantScan = { violations: string[]; allowed: number };

function scanImportant(file: string): ImportantScan {
  const css = blankOutComments(readFileSync(file, 'utf8'));
  const result: ImportantScan = { violations: [], allowed: 0 };
  const stack: boolean[] = [];
  let prelude = '';
  let line = 1;
  let lineStart = 0;

  const check = (end: number, offset: number) => {
    const declaration = css.slice(offset, end);
    if (!/!\s*important/i.test(declaration)) return;
    if (stack.includes(true)) {
      result.allowed += 1;
      return;
    }
    result.violations.push(`${rel(file)}:${line}: ${declaration.trim()}`);
  };

  for (let index = 0; index < css.length; index += 1) {
    const char = css[index];
    if (char === '\n') {
      line += 1;
      lineStart = index + 1;
      prelude = '';
    } else if (char === '{') {
      stack.push(REDUCED_MOTION.test(prelude.trim()));
      prelude = '';
      lineStart = index + 1;
    } else if (char === '}') {
      check(index, lineStart);
      stack.pop();
      prelude = '';
      lineStart = index + 1;
    } else if (char === ';') {
      check(index, lineStart);
      prelude = '';
      lineStart = index + 1;
    } else {
      prelude += char;
    }
  }
  return result;
}

function isCustomPropertyName(name: ts.PropertyName): boolean {
  return (
    (ts.isStringLiteral(name) || ts.isNoSubstitutionTemplateLiteral(name)) &&
    name.text.startsWith('--')
  );
}

function unwrap(node: ts.Expression): ts.Expression {
  let current = node;
  while (
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isParenthesizedExpression(current) ||
    ts.isTypeAssertionExpression(current)
  ) {
    current = current.expression;
  }
  return current;
}

function findDeclaration(
  source: ts.SourceFile,
  name: string,
): ts.Expression | undefined {
  let found: ts.Expression | undefined;
  const visit = (node: ts.Node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === name &&
      node.initializer &&
      !found
    ) {
      found = node.initializer;
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

function returnedExpressions(fn: ts.Node): ts.Expression[] {
  const returns: ts.Expression[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isReturnStatement(node) && node.expression) {
      returns.push(node.expression);
    }
    if (node !== fn && ts.isFunctionLike(node)) return;
    ts.forEachChild(node, visit);
  };
  if (
    (ts.isArrowFunction(fn) || ts.isFunctionExpression(fn)) &&
    !ts.isBlock(fn.body)
  ) {
    return [fn.body];
  }
  visit(fn);
  return returns;
}

function findFunction(
  source: ts.SourceFile,
  name: string,
): ts.FunctionLikeDeclaration | undefined {
  let found: ts.FunctionLikeDeclaration | undefined;
  const visit = (node: ts.Node) => {
    if (found) return;
    if (ts.isFunctionDeclaration(node) && node.name?.text === name) {
      found = node;
      return;
    }
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === name &&
      node.initializer
    ) {
      const init = unwrap(node.initializer);
      if (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) {
        found = init;
        return;
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

function parse(file: string): ts.SourceFile {
  return ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
}

function importedSource(
  source: ts.SourceFile,
  name: string,
): ts.SourceFile | undefined {
  for (const statement of source.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      !statement.moduleSpecifier.text.startsWith('.')
    ) {
      continue;
    }
    const bindings = statement.importClause?.namedBindings;
    if (
      !bindings ||
      !ts.isNamedImports(bindings) ||
      !bindings.elements.some((element) => element.name.text === name)
    ) {
      continue;
    }
    const base = resolve(
      dirname(source.fileName),
      statement.moduleSpecifier.text,
    );
    const target = ['.ts', '.tsx'].map((ext) => base + ext).find(existsSync);
    return target ? parse(target) : undefined;
  }
  return undefined;
}

function problemsIn(
  source: ts.SourceFile,
  expression: ts.Expression,
  depth = 0,
): string[] {
  const node = unwrap(expression);
  if (depth > 5) return ['unresolvable style value'];
  if (ts.isObjectLiteralExpression(node)) {
    return node.properties.flatMap((property) => {
      if (ts.isSpreadAssignment(property)) return ['spread in style object'];
      if (!property.name || !isCustomPropertyName(property.name)) {
        return [`non-custom property "${property.name?.getText(source)}"`];
      }
      return [];
    });
  }
  if (ts.isIdentifier(node)) {
    const declared = findDeclaration(source, node.text);
    if (!declared) {
      return [`unresolvable style value "${node.text}"`];
    }
    return problemsIn(source, declared, depth + 1);
  }
  if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
    const name = node.expression.text;
    const origin = findFunction(source, name)
      ? source
      : importedSource(source, name);
    const fn = origin && findFunction(origin, name);
    if (!origin || !fn) return [`unresolvable style call "${name}"`];
    const returns = returnedExpressions(fn);
    if (returns.length === 0) return ['style function returns nothing'];
    return returns.flatMap((value) => problemsIn(origin, value, depth + 1));
  }
  return [`unresolvable style value "${node.getText(source)}"`];
}

function scanStyleProps(file: string): string[] {
  const source = parse(file);
  const violations: string[] = [];
  const visit = (node: ts.Node) => {
    if (
      ts.isJsxAttribute(node) &&
      node.name.getText(source) === 'style' &&
      node.initializer &&
      ts.isJsxExpression(node.initializer) &&
      node.initializer.expression
    ) {
      const { line } = source.getLineAndCharacterOfPosition(node.getStart());
      for (const problem of problemsIn(source, node.initializer.expression)) {
        violations.push(`${rel(file)}:${line + 1}: ${problem}`);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return violations;
}

describe('styles guard', () => {
  const all = walk(SRC);
  const cssFiles = all.filter((file) => file.endsWith('.css'));
  const tsxFiles = all.filter(
    (file) => file.endsWith('.tsx') && !file.endsWith('.test.tsx'),
  );

  it('finds css and tsx files to check', () => {
    expect(cssFiles.length).toBeGreaterThan(0);
    expect(tsxFiles.length).toBeGreaterThan(0);
  });

  it('keeps !important only inside prefers-reduced-motion', () => {
    const scans = cssFiles.map(scanImportant);
    expect(scans.flatMap((scan) => scan.violations)).toEqual([]);
    expect(scans.reduce((sum, scan) => sum + scan.allowed, 0)).toBeGreaterThan(
      0,
    );
  });

  it('puts only custom properties in the style prop', () => {
    expect(tsxFiles.flatMap(scanStyleProps)).toEqual([]);
  });
});
