import type { DraftSelection, DraftV1 } from './schema';

function disableSiblings(
  draft: DraftV1,
  roomClientId: string,
  siblingIds: readonly string[],
): DraftV1 {
  return siblingIds.reduce(
    (next, siblingId) =>
      updateSelection(next, roomClientId, siblingId, (previous) =>
        previous ? { ...previous, disabled: true } : undefined,
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
  return disableSiblings(
    updateSelection(draft, roomClientId, categoryId, () => ({
      productId,
      disabled: false,
      source: 'manual',
    })),
    roomClientId,
    siblingIds,
  );
}

export function disableCategory(
  draft: DraftV1,
  roomClientId: string,
  categoryId: string,
): DraftV1 {
  return updateSelection(draft, roomClientId, categoryId, (previous) => ({
    productId: previous?.productId ?? null,
    source: previous?.source ?? 'manual',
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
