import { convertCentsToKopecks } from '@roomwise/calc-engine';

export function partKopecks(
  partCents: readonly number[],
  lineKopecks: number | null,
  rate: string | null,
): (number | null)[] {
  if (lineKopecks === null || rate === null) {
    return partCents.map(() => null);
  }
  const kopecks = partCents.map((cents) => convertCentsToKopecks(cents, rate));
  const last = partCents.findLastIndex((cents) => cents !== 0);
  if (last === -1) {
    return kopecks;
  }
  const others = kopecks.reduce(
    (sum, value, index) => (index === last ? sum : sum + value),
    0,
  );
  kopecks[last] = lineKopecks - others;
  return kopecks;
}
