import type { Estimate, EstimateLine, Section } from '@roomwise/calc-engine';

export type Money = { usdCents: number; uahKopecks: number | null };

export type CostPanelView = {
  base: Money | null;
  materials: Money | null;
  engineering: Money | null;
  additional: Money | null;
  total: Money | null;
};

export type CostPanelOptions = {
  blockedSections?: ReadonlySet<Section>;
  materialsReady?: boolean;
};

export type LineView = Omit<
  EstimateLine,
  'amountCents' | 'amountUahKopecks'
> & {
  amountCents: number | null;
  amountUahKopecks: number | null;
};

export type RoomLines = { roomClientId: string; lines: LineView[] };

export type GroupedLines = {
  base: LineView[];
  materials: RoomLines[];
  engineering: LineView[];
  additional: LineView[];
};

const EMPTY_PANEL: CostPanelView = {
  base: null,
  materials: null,
  engineering: null,
  additional: null,
  total: null,
};

function sumMoney(parts: readonly Money[]): Money {
  let usdCents = 0;
  let uahKopecks: number | null = 0;
  for (const part of parts) {
    usdCents += part.usdCents;
    uahKopecks =
      uahKopecks === null || part.uahKopecks === null
        ? null
        : uahKopecks + part.uahKopecks;
  }
  return { usdCents, uahKopecks };
}

export function toCostPanelView(
  estimate: Estimate | null,
  options: CostPanelOptions = {},
): CostPanelView {
  if (estimate === null) {
    return EMPTY_PANEL;
  }
  const { blockedSections = new Set<Section>(), materialsReady = true } =
    options;
  const { sections } = estimate.totals;
  const pick = (...names: Section[]): Money | null =>
    names.some((name) => blockedSections.has(name))
      ? null
      : sumMoney(names.map((name) => sections[name]));

  const base = pick('BASE', 'OBJECT');
  const materials = materialsReady ? pick('MATERIALS') : null;
  const engineering = pick('ENGINEERING');
  const additional = pick('ADDITIONAL');
  const total = blockedSections.size > 0 ? null : estimate.totals;

  return {
    base,
    materials,
    engineering,
    additional,
    total: total && { usdCents: total.usdCents, uahKopecks: total.uahKopecks },
  };
}

function toLineView(
  line: EstimateLine,
  blockedLineIds: ReadonlySet<string>,
): LineView {
  return blockedLineIds.has(line.id)
    ? { ...line, amountCents: null, amountUahKopecks: null }
    : line;
}

export function groupLines(
  estimate: Estimate,
  roomOrder: readonly string[],
  blockedLineIds: ReadonlySet<string> = new Set(),
): GroupedLines {
  const grouped: GroupedLines = {
    base: [],
    materials: [],
    engineering: [],
    additional: [],
  };
  const byRoom = new Map<string, LineView[]>();
  for (const line of estimate.lines) {
    const view = toLineView(line, blockedLineIds);
    switch (line.section) {
      case 'BASE':
      case 'OBJECT':
        grouped.base.push(view);
        break;
      case 'ENGINEERING':
        grouped.engineering.push(view);
        break;
      case 'ADDITIONAL':
        grouped.additional.push(view);
        break;
      case 'MATERIALS': {
        const key = line.roomClientId ?? '';
        const bucket = byRoom.get(key) ?? [];
        bucket.push(view);
        byRoom.set(key, bucket);
        break;
      }
    }
  }
  const known = new Set(roomOrder);
  const ordered = [
    ...roomOrder,
    ...[...byRoom.keys()].filter((key) => !known.has(key)),
  ];
  for (const roomClientId of ordered) {
    const lines = byRoom.get(roomClientId);
    if (lines) {
      grouped.materials.push({ roomClientId, lines });
    }
  }
  return grouped;
}
