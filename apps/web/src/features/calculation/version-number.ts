const VERSION_NUMBER = /^[1-9]\d*$/;
const PUBLIC_ID_MAX = 64;

export function parseVersionNumber(raw: string): number | null {
  if (!VERSION_NUMBER.test(raw)) {
    return null;
  }
  const value = Number(raw);
  return Number.isSafeInteger(value) ? value : null;
}

export function isPublicId(value: string): boolean {
  return value.length > 0 && value.length <= PUBLIC_ID_MAX;
}
