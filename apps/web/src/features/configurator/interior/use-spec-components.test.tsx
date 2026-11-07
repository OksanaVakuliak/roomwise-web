import { type EstimateLine, estimate } from '@roomwise/calc-engine';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { toConfiguration } from '@/lib/engine/to-configuration';
import { categoryIds, productIds } from '@/test/fixtures/catalog';
import { makePricingData } from '@/test/fixtures/pricing-data';
import {
  forEachLocale,
  renderWithProviders,
} from '@/test/render-with-providers';
import en from '../../../../messages/en.json';
import uk from '../../../../messages/uk.json';
import type { RoomPricing } from '../shell/use-room-pricing';
import {
  livingId,
  makePartialRoomDraft,
  styleSelection,
} from './interior-step.helpers';
import { type SpecCategory, useSpecComponents } from './use-spec-components';

const tileId = 'cat-wall-tile';
const base = makePricingData();
const pricing = makePricingData({
  categories: [
    ...base.categories,
    { id: tileId, wastePercent: 5, surface: 'WALLS', requiresPutty: false },
  ],
  products: [
    ...base.products,
    {
      id: 'p-wall-tile',
      categoryId: tileId,
      materialTypeId: 'mt-tile',
      priceCents: 3000,
      unit: 'SQM',
      wastePercentOverride: null,
      heatedFloorCompatible: true,
      available: true,
    },
  ],
  rules: [
    ...base.rules,
    {
      id: 'rule-wall-tile',
      level: 'CATEGORY',
      categoryId: tileId,
      materialTypeId: null,
      name: { en: 'Wall tile', uk: 'Плитка на стінах' },
      quantityFormula: 'wallArea * (1 + waste)',
      costFormula: 'quantity * price',
      sortOrder: 0,
      surface: null,
      laborFormula: 'quantity * 6',
      baseComponent: false,
    },
  ],
});

const categories: SpecCategory[] = [
  { id: categoryIds.walls, name: 'Paint', surface: 'WALLS' },
  { id: tileId, name: 'Tile', surface: 'WALLS' },
];

function lines() {
  const draft = makePartialRoomDraft('PRE_FINISH', {
    [categoryIds.walls]: styleSelection(productIds.paint),
    [tileId]: styleSelection('p-wall-tile'),
  });
  const configuration = toConfiguration(draft, pricing, {
    mode: 'preview',
    currency: 'USD',
  });
  const all = estimate(configuration!, pricing).lines;
  return {
    first: all.find(
      (l) => l.id === `MATERIALS:${livingId}:${categoryIds.walls}`,
    ),
    second: all.find((l) => l.id === `MATERIALS:${livingId}:${tileId}`),
  };
}

function Probe({ line }: { line: ReturnType<typeof lines>['first'] }) {
  const describe = useSpecComponents(
    {
      partial: true,
      formatParts: (line: EstimateLine) =>
        (line.components ?? []).map((part) => `#${part.amountCents}`),
    } as unknown as RoomPricing,
    categories,
  );
  return (
    <ul>
      {describe(line).items.map((item) => (
        <li key={item.id}>
          {item.label}
          {item.amount}
        </li>
      ))}
    </ul>
  );
}

describe('useSpecComponents', () => {
  it.each(forEachLocale)(
    'shows preparation once per surface in %s',
    (locale) => {
      const { first, second } = lines();
      const prepOf = (line: typeof first) =>
        line?.components?.find((c) => c.kind === 'PREP');
      expect(prepOf(first)?.amountCents).toBeGreaterThan(0);
      expect(prepOf(second)?.amountCents).toBe(0);
      expect(prepOf(second)?.sharedWithCategoryId).toBe(categoryIds.walls);

      const text = { en, uk }[locale];
      const view = renderWithProviders(<Probe line={second} />, { locale });
      const shared = text.Specification.prepShared
        .replace('{surface}', text.Surface.for.WALLS)
        .replace('{name}', 'Paint');
      expect(screen.getByText(shared)).toBeInTheDocument();
      expect(screen.queryByText(text.Specification.components.prep)).toBeNull();
      view.unmount();

      renderWithProviders(<Probe line={first} />, { locale });
      expect(
        screen.getByText(
          `${text.Specification.components.prep}#${prepOf(first)?.amountCents}`,
        ),
      ).toBeInTheDocument();
    },
  );
});
