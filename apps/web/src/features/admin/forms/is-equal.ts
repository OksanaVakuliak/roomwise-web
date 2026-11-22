const definedKeys = (value: Record<string, unknown>) =>
  Object.keys(value).filter((key) => value[key] !== undefined);

const isPlain = (value: object) => {
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

export function isEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (
    typeof a !== 'object' ||
    typeof b !== 'object' ||
    a === null ||
    b === null
  ) {
    return false;
  }
  if (a instanceof Date || b instanceof Date) {
    return (
      a instanceof Date && b instanceof Date && a.getTime() === b.getTime()
    );
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (!Array.isArray(a) && !(isPlain(a) && isPlain(b))) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, i) => isEqual(item, b[i]));
  }
  const left = a as Record<string, unknown>;
  const right = b as Record<string, unknown>;
  const keys = definedKeys(left);
  if (keys.length !== definedKeys(right).length) return false;
  return keys.every((key) => isEqual(left[key], right[key]));
}
