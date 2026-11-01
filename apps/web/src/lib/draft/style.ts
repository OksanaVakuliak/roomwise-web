import type { RoomTypeCode } from '@roomwise/calc-engine';
import type { components } from '@/generated/api';
import type { DraftSelection, DraftV1 } from './schema';
import {
  activateFirstPerSurface,
  categoriesOfRoomType,
  normalizeSelections,
} from './surfaces';

type Schemas = components['schemas'];

export type DefaultMaterials =
  Schemas['PublicDefaultMaterialsResponseDto_Output'];
export type RoomTypesCatalog = Schemas['PublicRoomTypesResponseDto_Output'];
export type RoomCatalog = {
  defaultMaterials: DefaultMaterials | null;
  roomTypes: RoomTypesCatalog;
};

type Selections = Record<string, DraftSelection>;

function categoryIdsOf(
  roomTypeCode: RoomTypeCode | null,
  roomTypes: RoomTypesCatalog,
): string[] {
  const type = roomTypes.items.find((item) => item.code === roomTypeCode);
  return type ? type.categories.map((category) => category.id) : [];
}

function styleSelection(
  roomTypeCode: RoomTypeCode,
  categoryId: string,
  defaultMaterials: DefaultMaterials,
): DraftSelection {
  const match = defaultMaterials.items.find(
    (item) =>
      item.roomTypeCode === roomTypeCode && item.categoryId === categoryId,
  );
  return {
    productId: match?.productId ?? null,
    disabled: false,
    source: 'style',
  };
}

export function materialsForRoom(
  roomTypeCode: RoomTypeCode | null,
  defaultMaterials: DefaultMaterials,
  roomTypes: RoomTypesCatalog,
): Selections {
  if (roomTypeCode === null) {
    return {};
  }
  const selections = Object.fromEntries(
    categoryIdsOf(roomTypeCode, roomTypes).map((categoryId) => [
      categoryId,
      styleSelection(roomTypeCode, categoryId, defaultMaterials),
    ]),
  );
  return activateFirstPerSurface(
    selections,
    categoriesOfRoomType(roomTypeCode, roomTypes),
  );
}

export function applyStyle(
  draft: DraftV1,
  defaultMaterials: DefaultMaterials,
  roomTypes: RoomTypesCatalog,
): DraftV1 {
  return {
    ...draft,
    styleId: defaultMaterials.styleId,
    rooms: draft.rooms.map((room) => ({
      ...room,
      selections: materialsForRoom(
        room.roomTypeCode,
        defaultMaterials,
        roomTypes,
      ),
    })),
  };
}

export function hasManualChanges(draft: DraftV1): boolean {
  return draft.rooms.some((room) =>
    Object.values(room.selections).some(
      (selection) => selection.source === 'manual',
    ),
  );
}

export function retypeSelections(
  previous: Selections,
  roomTypeCode: RoomTypeCode | null,
  defaultMaterials: DefaultMaterials | null,
  roomTypes: RoomTypesCatalog,
): Selections {
  const fresh =
    defaultMaterials === null
      ? {}
      : materialsForRoom(roomTypeCode, defaultMaterials, roomTypes);
  const surfaceOf = new Map(
    roomTypes.items.flatMap((type) =>
      type.categories.map((category) => [category.id, category.surface]),
    ),
  );
  const surfaceWasOff = (surface: string) => {
    const onSurface = Object.entries(previous).filter(
      ([categoryId]) => surfaceOf.get(categoryId) === surface,
    );
    return (
      onSurface.length > 0 &&
      onSurface.every(([, selection]) => selection.disabled)
    );
  };
  const merged = Object.fromEntries(
    categoryIdsOf(roomTypeCode, roomTypes).flatMap((categoryId) => {
      const before = previous[categoryId];
      const styled = fresh[categoryId];
      if (before && (before.source === 'manual' || !styled)) {
        return [[categoryId, before]];
      }
      if (styled) {
        const surface = surfaceOf.get(categoryId) ?? 'NONE';
        const disabled =
          surface === 'NONE'
            ? (before?.disabled ?? styled.disabled)
            : surfaceWasOff(surface) || styled.disabled;
        return [[categoryId, { ...styled, disabled }]];
      }
      return [];
    }),
  );
  return normalizeSelections(
    merged,
    categoriesOfRoomType(roomTypeCode, roomTypes),
  );
}
