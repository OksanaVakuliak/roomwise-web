import { describe, expect, it } from 'vitest';
import {
  categoryIds,
  makeDefaultMaterials,
  makeRoomTypes,
  productIds,
  styleIds,
} from '@/test/fixtures/catalog';
import { makeDraftRoom, makeEmptyDraft } from '@/test/fixtures/draft';
import { makePricingData } from '@/test/fixtures/pricing-data';
import { type ReconcileCatalog, reconcile } from './reconcile';
import type { DraftSelection } from './schema';

const roomId = '00000000-0000-4000-8000-000000000301';
const style = (productId: string | null, disabled = false): DraftSelection => ({
  productId,
  disabled,
  source: 'style',
});
const manual = (productId: string | null): DraftSelection => ({
  productId,
  disabled: false,
  source: 'manual',
});
const validSelections = {
  [categoryIds.floor]: style(productIds.laminate),
  [categoryIds.walls]: style(productIds.paint),
  [categoryIds.ceiling]: style(productIds.ceilingPaint),
};

function makeCatalog(
  overrides: Partial<ReconcileCatalog> = {},
): ReconcileCatalog {
  return {
    pricingData: makePricingData(),
    roomTypes: makeRoomTypes(),
    defaultMaterials: makeDefaultMaterials(styleIds.modern),
    styleIds: [styleIds.modern, styleIds.classic],
    ...overrides,
  };
}

function withUnavailable(...ids: string[]) {
  const pricingData = makePricingData();
  return {
    ...pricingData,
    products: pricingData.products.map((product) =>
      ids.includes(product.id) ? { ...product, available: false } : product,
    ),
  };
}

function draftWith(selections: Record<string, DraftSelection>) {
  return makeEmptyDraft({
    styleId: styleIds.modern,
    rooms: [makeDraftRoom({ clientId: roomId, selections })],
  });
}

describe('reconcile', () => {
  it('replaces an unavailable product with the style default', () => {
    const draft = draftWith({
      ...validSelections,
      [categoryIds.floor]: manual(productIds.laminatePremium),
    });
    const catalog = makeCatalog({
      pricingData: withUnavailable(productIds.laminatePremium),
    });

    const result = reconcile(draft, catalog);

    expect(result.draft.rooms[0]?.selections[categoryIds.floor]).toEqual(
      style(productIds.laminate),
    );
    expect(result.replacements).toEqual([
      {
        roomClientId: roomId,
        categoryId: categoryIds.floor,
        fromProductId: productIds.laminatePremium,
        toProductId: productIds.laminate,
      },
    ]);
  });

  it('replaces an unknown product', () => {
    const draft = draftWith({
      ...validSelections,
      [categoryIds.walls]: manual('gone'),
    });

    const result = reconcile(draft, makeCatalog());

    expect(result.draft.rooms[0]?.selections[categoryIds.walls]).toEqual(
      style(productIds.paint),
    );
  });

  it('asks to choose a material when the style default is unavailable', () => {
    const draft = draftWith({
      ...validSelections,
      [categoryIds.floor]: manual(productIds.laminatePremium),
    });
    const catalog = makeCatalog({
      pricingData: withUnavailable(
        productIds.laminatePremium,
        productIds.laminate,
      ),
    });

    const result = reconcile(draft, catalog);

    expect(result.draft.rooms[0]?.selections[categoryIds.floor]).toEqual(
      style(null),
    );
    expect(result.replacements[0]?.toProductId).toBeNull();
  });

  it('asks to choose a material when no style is chosen', () => {
    const draft = draftWith({
      ...validSelections,
      [categoryIds.floor]: manual('gone'),
    });

    const result = reconcile(draft, makeCatalog({ defaultMaterials: null }));

    expect(result.draft.rooms[0]?.selections[categoryIds.floor]).toEqual(
      style(null),
    );
  });

  it('replaces a disabled selection without reporting it', () => {
    const draft = draftWith({
      ...validSelections,
      [categoryIds.ceiling]: style('gone', true),
    });

    const result = reconcile(draft, makeCatalog());

    expect(result.draft.rooms[0]?.selections[categoryIds.ceiling]).toEqual(
      style(productIds.ceilingPaint, true),
    );
    expect(result.replacements).toEqual([]);
  });

  it('removes a category that no longer belongs to the room type', () => {
    const draft = draftWith({
      ...validSelections,
      'cat-removed': manual(productIds.paint),
    });

    const result = reconcile(draft, makeCatalog());

    expect(result.draft.rooms[0]?.selections).toEqual(validSelections);
    expect(result.replacements).toEqual([]);
  });

  it('adds a missing category from the style without reporting it', () => {
    const { [categoryIds.ceiling]: _removed, ...partial } = validSelections;
    const draft = draftWith(partial);

    const result = reconcile(draft, makeCatalog());

    expect(result.draft.rooms[0]?.selections).toEqual(validSelections);
    expect(result.replacements).toEqual([]);
  });

  it('adds a missing category empty when there is no style', () => {
    const { [categoryIds.ceiling]: _removed, ...partial } = validSelections;
    const draft = draftWith(partial);

    const result = reconcile(draft, makeCatalog({ defaultMaterials: null }));

    expect(result.draft.rooms[0]?.selections[categoryIds.ceiling]).toEqual(
      style(null),
    );
  });

  it('adds no categories before a style is chosen', () => {
    const draft = draftWith({});
    draft.styleId = null;

    const result = reconcile(draft, makeCatalog({ defaultMaterials: null }));

    expect(result.draft).toBe(draft);
  });

  it('keeps one active category per surface after adding', () => {
    const extended = {
      items: makeRoomTypes().items.map((type) => ({
        ...type,
        categories: [
          ...type.categories,
          {
            id: 'cat-wallpaper',
            name: 'Wallpaper',
            surface: 'WALLS' as const,
            wastePercent: 5,
            productCount: 1,
          },
        ],
      })),
    };
    const draft = draftWith(validSelections);

    const result = reconcile(draft, makeCatalog({ roomTypes: extended }));

    const selections = result.draft.rooms[0]?.selections ?? {};
    expect(selections[categoryIds.walls]?.disabled).toBe(false);
    expect(selections['cat-wallpaper']?.disabled).toBe(true);
  });

  it('adds a new category disabled when its surface was fully turned off', () => {
    const extended = {
      items: makeRoomTypes().items.map((type) => ({
        ...type,
        categories: [
          ...type.categories,
          {
            id: 'cat-underlay',
            name: 'Underlay',
            surface: 'FLOOR' as const,
            wastePercent: 5,
            productCount: 1,
          },
        ],
      })),
    };
    const draft = draftWith({
      ...validSelections,
      [categoryIds.floor]: style(productIds.laminate, true),
    });

    const result = reconcile(draft, makeCatalog({ roomTypes: extended }));

    expect(result.draft.rooms[0]?.selections['cat-underlay']?.disabled).toBe(
      true,
    );
  });

  it('does not use style materials once the style was removed', () => {
    const draft = draftWith({
      ...validSelections,
      [categoryIds.floor]: manual(productIds.laminatePremium),
    });
    draft.styleId = 'removed';

    const result = reconcile(
      draft,
      makeCatalog({
        pricingData: withUnavailable(productIds.laminatePremium),
      }),
    );

    expect(result.draft.styleId).toBeNull();
    expect(
      result.draft.rooms[0]?.selections[categoryIds.floor]?.productId,
    ).toBe(null);
    expect(result.replacements[0]?.toProductId).toBeNull();
  });

  it('ignores default materials of a different style', () => {
    const draft = draftWith({
      ...validSelections,
      [categoryIds.floor]: manual(productIds.laminatePremium),
    });
    draft.styleId = styleIds.classic;

    const result = reconcile(
      draft,
      makeCatalog({
        pricingData: withUnavailable(productIds.laminatePremium),
        defaultMaterials: makeDefaultMaterials(styleIds.modern),
      }),
    );

    expect(result.replacements[0]?.toProductId).toBeNull();
  });

  it('removes options missing from pricing data or unavailable', () => {
    const pricingData = makePricingData();
    const options = pricingData.options.map((option) =>
      option.id === 'opt-design' ? { ...option, available: false } : option,
    );
    const draft = makeEmptyDraft({
      options: { 'opt-ac': { quantity: 2 }, 'opt-design': {}, gone: {} },
    });

    const result = reconcile(
      draft,
      makeCatalog({ pricingData: { ...pricingData, options } }),
    );

    expect(result.draft.options).toEqual({ 'opt-ac': { quantity: 2 } });
  });

  it('clamps an option quantity into its range', () => {
    const draft = makeEmptyDraft({
      options: {
        'opt-ac': { quantity: 99 },
        'opt-heated-floor': { quantity: 99 },
      },
    });

    const result = reconcile(draft, makeCatalog());

    expect(result.draft.options['opt-ac']).toEqual({ quantity: 10 });
    expect(result.draft.options['opt-heated-floor']).toEqual({ quantity: 99 });
  });

  it('raises a quantity below the minimum', () => {
    const draft = makeEmptyDraft({ options: { 'opt-ac': { quantity: 0 } } });

    const result = reconcile(draft, makeCatalog());

    expect(result.draft.options['opt-ac']).toEqual({ quantity: 1 });
  });

  it('leaves an undefined quantity undefined', () => {
    const draft = makeEmptyDraft({
      options: { 'opt-ac': { roomClientIds: [roomId] } },
    });

    const result = reconcile(draft, makeCatalog());

    expect(result.draft).toBe(draft);
  });

  it('clears a style that no longer exists', () => {
    const draft = makeEmptyDraft({ styleId: 'removed' });

    const result = reconcile(draft, makeCatalog());

    expect(result.draft.styleId).toBeNull();
  });

  it('leaves rooms with an unknown or missing type untouched', () => {
    const unknown = makeDraftRoom({
      clientId: 'a',
      roomTypeCode: 'BEDROOM',
      selections: { stray: manual('gone') },
    });
    const untyped = makeDraftRoom({
      clientId: 'b',
      roomTypeCode: null,
      selections: { stray: manual('gone') },
    });
    const draft = makeEmptyDraft({
      styleId: styleIds.modern,
      rooms: [unknown, untyped],
    });
    const roomTypes = makeRoomTypes();

    const result = reconcile(
      draft,
      makeCatalog({
        roomTypes: {
          items: roomTypes.items.filter((type) => type.code !== 'BEDROOM'),
        },
      }),
    );

    expect(result.draft).toBe(draft);
    expect(result.replacements).toEqual([]);
  });

  it('returns the same draft when nothing changed', () => {
    const draft = draftWith(validSelections);

    const result = reconcile(draft, makeCatalog());

    expect(result.draft).toBe(draft);
    expect(result.replacements).toEqual([]);
  });

  it('is idempotent', () => {
    const draft = draftWith({
      ...validSelections,
      [categoryIds.floor]: manual('gone'),
    });
    const first = reconcile(draft, makeCatalog());

    const second = reconcile(first.draft, makeCatalog());

    expect(second.draft).toBe(first.draft);
    expect(second.replacements).toEqual([]);
  });

  it('does not mutate the input', () => {
    const draft = draftWith({
      ...validSelections,
      [categoryIds.floor]: manual('gone'),
    });
    draft.options = { gone: {}, 'opt-ac': { quantity: 99 } };
    draft.styleId = 'removed';
    const snapshot = structuredClone(draft);

    reconcile(draft, makeCatalog());

    expect(draft).toEqual(snapshot);
  });
});
