import type { PricingData } from '@roomwise/calc-engine';
import type { DraftOption, DraftRoom, DraftSelection, DraftV1 } from './schema';
import type { DefaultMaterials, RoomTypesCatalog } from './style';
import {
  categoriesOfRoomType,
  normalizeSelections,
  surfaceWasOff,
} from './surfaces';

export type ReconcileCatalog = {
  pricingData: PricingData;
  roomTypes: RoomTypesCatalog;
  defaultMaterials: DefaultMaterials | null;
  styleIds: readonly string[];
};

export type Replacement = {
  roomClientId: string;
  categoryId: string;
  fromProductId: string | null;
  toProductId: string | null;
};

type Selections = Record<string, DraftSelection>;

function availableProductIds(pricingData: PricingData): Set<string> {
  return new Set(
    pricingData.products
      .filter((product) => product.available !== false)
      .map((product) => product.id),
  );
}

function styleProductId(
  room: DraftRoom,
  categoryId: string,
  catalog: ReconcileCatalog,
  available: Set<string>,
): string | null {
  const productId = catalog.defaultMaterials?.items.find(
    (item) =>
      item.roomTypeCode === room.roomTypeCode && item.categoryId === categoryId,
  )?.productId;
  return productId != null && available.has(productId) ? productId : null;
}

function sameSelections(a: Selections, b: Selections): boolean {
  const keys = Object.keys(a);
  return (
    keys.length === Object.keys(b).length &&
    keys.every((key) => a[key] === b[key])
  );
}

function reconcileRoom(
  room: DraftRoom,
  catalog: ReconcileCatalog,
  available: Set<string>,
  styled: boolean,
  partial: boolean,
): { room: DraftRoom; replacements: Replacement[] } {
  const categories = categoriesOfRoomType(room.roomTypeCode, catalog.roomTypes);
  if (categories.length === 0) {
    return { room, replacements: [] };
  }
  const replacements: Replacement[] = [];
  const selections: Selections = {};
  const surfaceOf = new Map(
    categories.map((category) => [category.id, category.surface]),
  );
  for (const { id } of categories) {
    const current = room.selections[id];
    if (!current) {
      if (partial) {
        selections[id] = { productId: null, disabled: true, source: 'style' };
        continue;
      }
      if (!styled) {
        continue;
      }
      const surface = surfaceOf.get(id) ?? 'NONE';
      selections[id] = {
        productId: styleProductId(room, id, catalog, available),
        disabled:
          surface !== 'NONE' &&
          surfaceWasOff(room.selections, surfaceOf, surface),
        source: 'style',
      };
    } else if (current.productId === null || available.has(current.productId)) {
      selections[id] = current;
    } else {
      const toProductId = styleProductId(room, id, catalog, available);
      selections[id] = {
        productId: toProductId,
        disabled: current.disabled,
        source: 'style',
      };
      if (!current.disabled) {
        replacements.push({
          roomClientId: room.clientId,
          categoryId: id,
          fromProductId: current.productId,
          toProductId,
        });
      }
    }
  }
  const normalized = normalizeSelections(selections, categories);
  return sameSelections(room.selections, normalized)
    ? { room, replacements }
    : { room: { ...room, selections: normalized }, replacements };
}

function clampQuantity(
  quantity: number,
  option: PricingData['options'][number],
): number {
  const min = option.minQuantity ?? -Infinity;
  const max = option.maxQuantity ?? Infinity;
  return Math.min(Math.max(quantity, min), max);
}

function reconcileOptions(
  options: DraftV1['options'],
  pricingData: PricingData,
): DraftV1['options'] {
  const result: Record<string, DraftOption> = {};
  let changed = false;
  for (const [id, chosen] of Object.entries(options)) {
    const option = pricingData.options.find((item) => item.id === id);
    if (!option || option.available === false) {
      changed = true;
      continue;
    }
    if (chosen.quantity === undefined) {
      result[id] = chosen;
      continue;
    }
    const quantity = clampQuantity(chosen.quantity, option);
    if (quantity === chosen.quantity) {
      result[id] = chosen;
    } else {
      changed = true;
      result[id] = { ...chosen, quantity };
    }
  }
  return changed ? result : options;
}

export function reconcile(
  draft: DraftV1,
  catalog: ReconcileCatalog,
): { draft: DraftV1; replacements: Replacement[] } {
  const available = availableProductIds(catalog.pricingData);
  const styleId =
    draft.styleId !== null && !catalog.styleIds.includes(draft.styleId)
      ? null
      : draft.styleId;
  const scoped: ReconcileCatalog = {
    ...catalog,
    defaultMaterials:
      styleId !== null && catalog.defaultMaterials?.styleId === styleId
        ? catalog.defaultMaterials
        : null,
  };
  const results = draft.rooms.map((room) =>
    reconcileRoom(
      room,
      scoped,
      available,
      styleId !== null,
      draft.object.scope === 'PARTIAL',
    ),
  );
  const rooms = results.every(
    (result, index) => result.room === draft.rooms[index],
  )
    ? draft.rooms
    : results.map((result) => result.room);
  const options = reconcileOptions(draft.options, catalog.pricingData);
  if (
    rooms === draft.rooms &&
    options === draft.options &&
    styleId === draft.styleId
  ) {
    return { draft, replacements: [] };
  }
  return {
    draft: { ...draft, rooms, options, styleId },
    replacements: results.flatMap((result) => result.replacements),
  };
}
