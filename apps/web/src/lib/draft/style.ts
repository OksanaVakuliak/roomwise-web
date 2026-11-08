import type { RoomTypeCode } from '@roomwise/calc-engine';
import type { components } from '@/generated/api';
import type { DraftSelection, DraftV1 } from './schema';
import {
  activateFirstPerSurface,
  categoriesOfRoomType,
  normalizeSelections,
  surfaceWasOff,
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

const DISABLED: DraftSelection = {
  productId: null,
  disabled: true,
  source: 'style',
};

export function disabledSelections(
  roomTypeCode: RoomTypeCode | null,
  roomTypes: RoomTypesCatalog,
): Selections {
  return Object.fromEntries(
    categoryIdsOf(roomTypeCode, roomTypes).map((categoryId) => [
      categoryId,
      DISABLED,
    ]),
  );
}

export function materialsForRoom(
  roomTypeCode: RoomTypeCode | null,
  defaultMaterials: DefaultMaterials,
  roomTypes: RoomTypesCatalog,
  scope: DraftV1['object']['scope'] = 'FULL',
): Selections {
  if (roomTypeCode === null) {
    return {};
  }
  if (scope === 'PARTIAL') {
    return disabledSelections(roomTypeCode, roomTypes);
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
      selections:
        draft.object.scope === 'PARTIAL'
          ? partialStyleSelections(room, defaultMaterials, roomTypes)
          : materialsForRoom(room.roomTypeCode, defaultMaterials, roomTypes),
    })),
  };
}

function partialStyleSelections(
  room: DraftV1['rooms'][number],
  defaultMaterials: DefaultMaterials,
  roomTypes: RoomTypesCatalog,
): Selections {
  const { roomTypeCode } = room;
  if (roomTypeCode === null) {
    return {};
  }
  return Object.fromEntries(
    categoryIdsOf(roomTypeCode, roomTypes).map((categoryId) => {
      const previous = room.selections[categoryId];
      return [
        categoryId,
        !previous || previous.disabled
          ? DISABLED
          : {
              ...styleSelection(roomTypeCode, categoryId, defaultMaterials),
              ...(previous.areaShare !== undefined && {
                areaShare: previous.areaShare,
              }),
            },
      ];
    }),
  );
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
  scope: DraftV1['object']['scope'] = 'FULL',
): Selections {
  if (scope === 'PARTIAL') {
    return normalizeSelections(
      Object.fromEntries(
        categoryIdsOf(roomTypeCode, roomTypes).map((categoryId) => [
          categoryId,
          previous[categoryId] ?? DISABLED,
        ]),
      ),
      categoriesOfRoomType(roomTypeCode, roomTypes),
    );
  }
  const fresh =
    defaultMaterials === null
      ? {}
      : materialsForRoom(roomTypeCode, defaultMaterials, roomTypes);
  const surfaceOf = new Map(
    roomTypes.items.flatMap((type) =>
      type.categories.map((category) => [category.id, category.surface]),
    ),
  );
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
            : surfaceWasOff(previous, surfaceOf, surface) || styled.disabled;
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
