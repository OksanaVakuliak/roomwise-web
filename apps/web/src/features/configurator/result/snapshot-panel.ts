import type { VersionView } from '@/lib/api/calculations';
import {
  type CostPanelView,
  type Money,
  sumMoney,
} from '@/lib/engine/sections';

type SnapshotTotals = VersionView['totals'];

export function snapshotPanel(totals: SnapshotTotals): CostPanelView {
  const part = (...names: string[]): Money =>
    sumMoney(
      names.map(
        (name) => totals.sections[name] ?? { usdCents: 0, uahKopecks: 0 },
      ),
    );
  return {
    base: part('BASE', 'OBJECT'),
    materials: part('MATERIALS'),
    engineering: part('ENGINEERING'),
    additional: part('ADDITIONAL'),
    total: { usdCents: totals.usdCents, uahKopecks: totals.uahKopecks },
  };
}
