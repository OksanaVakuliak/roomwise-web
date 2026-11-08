import type { RoomTypeCode } from '@roomwise/calc-engine';
import type { DraftSelection, DraftV1 } from './schema';
import { withoutShare } from './shares';
import type { RoomTypesCatalog } from './style';

type Selections = Record<string, DraftSelection>;
type CatalogCategory = RoomTypesCatalog['items'][number]['categories'][number];

export type SurfaceCategory = Pick<CatalogCategory, 'id' | 'surface'>;

export const FINISH_SURFACES = ['FLOOR', 'WALLS', 'CEILING'] as const;

export type FinishSurface = (typeof FINISH_SURFACES)[number];

export function categoriesOfRoomType(
  roomTypeCode: RoomTypeCode | null,
  roomTypes: RoomTypesCatalog,
): CatalogCategory[] {
  return (
    roomTypes.items.find((item) => item.code === roomTypeCode)?.categories ?? []
  );
}

export function surfaceWasOff(
  selections: Selections,
  surfaceOf: ReadonlyMap<string, string>,
  surface: string,
): boolean {
  const onSurface = Object.entries(selections).filter(
    ([categoryId]) => surfaceOf.get(categoryId) === surface,
  );
  return (
    onSurface.length > 0 &&
    onSurface.every(([, selection]) => selection.disabled)
  );
}

function groupBySurface(
  categories: readonly SurfaceCategory[],
): SurfaceCategory[][] {
  return FINISH_SURFACES.map((surface) =>
    categories.filter((category) => category.surface === surface),
  );
}

export function surfaceSiblings(
  categories: readonly SurfaceCategory[],
  categoryId: string,
): string[] {
  const surface = categories.find(
    (category) => category.id === categoryId,
  )?.surface;
  if (surface === undefined || surface === 'NONE') {
    return [];
  }
  return categories
    .filter(
      (category) => category.surface === surface && category.id !== categoryId,
    )
    .map((category) => category.id);
}

export function activateFirstPerSurface(
  selections: Selections,
  categories: readonly SurfaceCategory[],
): Selections {
  const result = { ...selections };
  for (const group of groupBySurface(categories)) {
    const winner =
      group.find((category) => result[category.id]?.productId != null) ??
      group[0];
    for (const category of group) {
      const selection = result[category.id];
      if (selection) {
        const disabled = category.id !== winner?.id;
        result[category.id] = {
          ...(disabled ? withoutShare(selection) : selection),
          disabled,
        };
      }
    }
  }
  return result;
}

export function normalizeSelections(
  selections: Selections,
  categories: readonly SurfaceCategory[],
): Selections {
  let result = selections;
  for (const group of groupBySurface(categories)) {
    const enabled = group.filter(
      (category) => selections[category.id]?.disabled === false,
    );
    const shared = enabled.filter(
      (category) => selections[category.id]?.areaShare !== undefined,
    );
    if (shared.length >= 2) {
      for (const category of enabled) {
        const selection = selections[category.id];
        if (selection && selection.areaShare === undefined) {
          result = {
            ...result,
            [category.id]: { ...selection, disabled: true },
          };
        }
      }
      continue;
    }
    const winner =
      enabled.find(
        (category) => selections[category.id]?.source === 'manual',
      ) ??
      enabled.find((category) => selections[category.id]?.productId != null) ??
      enabled[0];
    for (const category of enabled) {
      const selection = selections[category.id];
      if (category.id !== winner?.id && selection) {
        result = {
          ...result,
          [category.id]: { ...withoutShare(selection), disabled: true },
        };
      }
    }
  }
  return result;
}

export function normalizeDraft(
  draft: DraftV1,
  roomTypes: RoomTypesCatalog,
): DraftV1 {
  let changed = false;
  const rooms = draft.rooms.map((room) => {
    const selections = normalizeSelections(
      room.selections,
      categoriesOfRoomType(room.roomTypeCode, roomTypes),
    );
    if (selections === room.selections) {
      return room;
    }
    changed = true;
    return { ...room, selections };
  });
  return changed ? { ...draft, rooms } : draft;
}

export type CategoryGroup<C extends SurfaceCategory> = {
  key: string;
  surface: SurfaceCategory['surface'];
  categories: C[];
};

export function groupCategories<C extends SurfaceCategory>(
  categories: readonly C[],
): CategoryGroup<C>[] {
  const surfaces = FINISH_SURFACES.flatMap((surface) => {
    const members = categories.filter(
      (category) => category.surface === surface,
    );
    return members.length > 0
      ? [{ key: surface, surface, categories: members }]
      : [];
  });
  const independent = categories
    .filter((category) => category.surface === 'NONE')
    .map((category) => ({
      key: category.id,
      surface: category.surface,
      categories: [category],
    }));
  return [...surfaces, ...independent];
}

export function enabledCategoryOf<C extends SurfaceCategory>(
  group: CategoryGroup<C>,
  selections: Selections,
): C | undefined {
  return group.categories.find(
    (category) => selections[category.id]?.disabled === false,
  );
}
