const DECIMAL = /^(\d+([.,]\d*)?|[.,]\d+)$/;

export function parseDecimal(text: string): number | null | undefined {
  const trimmed = text.trim();
  if (trimmed === '') {
    return null;
  }
  if (!DECIMAL.test(trimmed)) {
    return undefined;
  }
  return Number(trimmed.replace(',', '.'));
}
