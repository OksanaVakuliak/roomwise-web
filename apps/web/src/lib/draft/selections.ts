import type { DraftSelection, DraftV1 } from './schema';
import { dropCoveringShare, isSharedCovering, withoutShare } from './shares';
import type { SurfaceCategory } from './surfaces';

function disableSiblings(
  draft: DraftV1,
  roomClientId: string,
  siblingIds: readonly string[],
): DraftV1 {
  return siblingIds.reduce(
    (next, siblingId) =>
      updateSelection(next, roomClientId, siblingId, (previous) =>
        previous ? { ...withoutShare(previous), disabled: true } : undefined,
      ),
    draft,
  );
}

function updateSelection(
  draft: DraftV1,
  roomClientId: string,
  categoryId: string,
  update: (previous: DraftSelection | undefined) => DraftSelection | undefined,
): DraftV1 {
  return {
    ...draft,
    rooms: draft.rooms.map((room) => {
      if (room.clientId !== roomClientId) {
        return room;
      }
      const next = update(room.selections[categoryId]);
      return next
        ? { ...room, selections: { ...room.selections, [categoryId]: next } }
        : room;
    }),
  };
}

export function selectProduct(
  draft: DraftV1,
  roomClientId: string,
  categoryId: string,
  productId: string,
  siblingIds: readonly string[] = [],
): DraftV1 {
  const room = draft.rooms.find((item) => item.clientId === roomClientId);
  const shared = isSharedCovering(room?.selections[categoryId]);
  const areaShare = room?.selections[categoryId]?.areaShare;
  const toDisable = shared
    ? siblingIds.filter(
        (siblingId) => !isSharedCovering(room?.selections[siblingId]),
      )
    : siblingIds;
  return disableSiblings(
    updateSelection(draft, roomClientId, categoryId, () => ({
      productId,
      disabled: false,
      source: 'manual',
      ...(shared && { areaShare }),
    })),
    roomClientId,
    toDisable,
  );
}

export function disableCategory(
  draft: DraftV1,
  roomClientId: string,
  categoryId: string,
  categories: readonly SurfaceCategory[] = [],
): DraftV1 {
  const room = draft.rooms.find((item) => item.clientId === roomClientId);
  const previous = room?.selections[categoryId];
  if (previous?.areaShare !== undefined) {
    return {
      ...draft,
      rooms: draft.rooms.map((item) =>
        item.clientId === roomClientId
          ? {
              ...item,
              selections: dropCoveringShare(
                item.selections,
                categories,
                categoryId,
              ),
            }
          : item,
      ),
    };
  }
  return updateSelection(draft, roomClientId, categoryId, (current) => ({
    productId: current?.productId ?? null,
    source: current?.source ?? 'manual',
    disabled: true,
  }));
}

export function enableCategory(
  draft: DraftV1,
  roomClientId: string,
  categoryId: string,
  siblingIds: readonly string[] = [],
): DraftV1 {
  return disableSiblings(
    updateSelection(draft, roomClientId, categoryId, (previous) =>
      previous ? { ...previous, disabled: false } : undefined,
    ),
    roomClientId,
    siblingIds,
  );
}
