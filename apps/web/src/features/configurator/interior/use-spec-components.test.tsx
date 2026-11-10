import {
  type EstimateLine,
  estimate,
  type PricingData,
} from '@roomwise/calc-engine';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { DraftV1 } from '@/lib/draft/schema';
import { toConfiguration } from '@/lib/engine/to-configuration';
import { makeInteriorDraft } from '@/test/fixtures';
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

function Probe({
  line,
  partial = true,
  data = pricing,
}: {
  line: ReturnType<typeof lines>['first'];
  partial?: boolean;
  data?: PricingData;
}) {
  const describe = useSpecComponents(
    {
      partial,
      pricing: data,
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

const bathId = '00000000-0000-4000-8000-000000000302';
const wallTileGlue = {
  ...pricing,
  rules: pricing.rules.map((rule) =>
    rule.id === 'rule-wall-tile'
      ? { ...rule, costFormula: 'quantity * (price + coef.tile_glue)' }
      : rule,
  ),
};

function lineOf(
  draft: DraftV1,
  data: PricingData,
  roomId: string,
  categoryId: string,
) {
  const configuration = toConfiguration(draft, data, {
    mode: 'preview',
    currency: 'USD',
  });
  return estimate(configuration!, data).lines.find(
    (line) => line.id === `MATERIALS:${roomId}:${categoryId}`,
  );
}

function bathDraft(heatedFloor: boolean): DraftV1 {
  const draft = makeInteriorDraft();
  return {
    ...draft,
    rooms: draft.rooms.map((room) =>
      room.clientId === bathId ? { ...room, heatedFloor } : room,
    ),
  };
}

function labels() {
  return screen.getAllByRole('listitem').map((item) => item.textContent);
}

describe('useSpecComponents accessories', () => {
  it.each(forEachLocale)(
    'shows the underlay under laminate in full mode in %s',
    (locale) => {
      const line = lineOf(
        makeInteriorDraft(),
        pricing,
        livingId,
        categoryIds.floor,
      );
      renderWithProviders(<Probe line={line} partial={false} />, { locale });

      const name = pricing.accessories?.laminate_underlay?.[locale];
      expect(labels()).toEqual([
        `${{ en, uk }[locale].Specification.components.material}#${line?.components?.[0].amountCents}`,
        `${name}#${line?.components?.[1].amountCents}`,
      ]);
    },
  );

  it.each(forEachLocale)(
    'names the glue by heated floor under floor tile in %s',
    (locale) => {
      const names = pricing.accessories!;
      const heated = lineOf(
        bathDraft(true),
        pricing,
        bathId,
        categoryIds.floor,
      );
      const view = renderWithProviders(
        <Probe line={heated} partial={false} />,
        {
          locale,
        },
      );
      expect(labels().join('|')).toContain(names.tile_glue_heated![locale]);
      expect(labels().join('|')).not.toContain(`${names.tile_glue![locale]}#`);
      view.unmount();

      const plain = lineOf(
        bathDraft(false),
        pricing,
        bathId,
        categoryIds.floor,
      );
      renderWithProviders(<Probe line={plain} partial={false} />, { locale });
      expect(labels().join('|')).toContain(`${names.tile_glue![locale]}#`);
      expect(labels().join('|')).not.toContain(names.tile_glue_heated![locale]);
    },
  );

  it('shows the glue under wall tile', () => {
    const draft = makePartialRoomDraft('PRE_FINISH', {
      [tileId]: styleSelection('p-wall-tile'),
    });
    const line = lineOf(draft, wallTileGlue, livingId, tileId);
    renderWithProviders(<Probe line={line} data={wallTileGlue} />);

    expect(labels().join('|')).toContain('Tile glue#');
  });

  it('hides line details in full mode without accessories', () => {
    const draft = makeInteriorDraft();
    const line = lineOf(draft, pricing, livingId, categoryIds.walls);
    const { container } = renderWithProviders(
      <Probe line={line} partial={false} />,
    );

    expect(container.querySelectorAll('li')).toHaveLength(0);
  });

  it('hides line details in full mode when the accessory has no name', () => {
    const line = lineOf(
      makeInteriorDraft(),
      pricing,
      livingId,
      categoryIds.floor,
    );
    const { container } = renderWithProviders(
      <Probe
        line={line}
        partial={false}
        data={{ ...pricing, accessories: {} }}
      />,
    );

    expect(container.querySelectorAll('li')).toHaveLength(0);
  });

  it('adds up the product and the accessories to the line amount', () => {
    for (const [draft, room] of [
      [makeInteriorDraft(), livingId],
      [bathDraft(true), bathId],
      [bathDraft(false), bathId],
    ] as const) {
      const line = lineOf(draft, pricing, room, categoryIds.floor);
      const parts = line?.components ?? [];
      expect(parts.map((part) => part.kind)).toEqual(['MATERIAL', 'ACCESSORY']);
      expect(parts.reduce((sum, part) => sum + part.amountCents, 0)).toBe(
        line?.amountCents,
      );
    }
  });
});
