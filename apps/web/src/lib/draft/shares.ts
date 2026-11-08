import { isShareSurface, type ShareSurface } from '@roomwise/calc-engine';
import type { DraftRoom, DraftSelection, DraftV1 } from './schema';
import type { SurfaceCategory } from './surfaces';

type Selections = Record<string, DraftSelection>;

export function shareSurfaceOf(
  categories: readonly SurfaceCategory[],
  categoryId: string,
): ShareSurface | null {
  const surface = categories.find(
    (category) => category.id === categoryId,
  )?.surface;
  return surface !== undefined && isShareSurface(surface) ? surface : null;
}

export function isSharedCovering(selection: DraftSelection | undefined) {
  return selection?.disabled === false && selection.areaShare !== undefined;
}

export function enabledOnSurface(
  selections: Selections,
  categories: readonly SurfaceCategory[],
  surface: string,
): string[] {
  return categories
    .filter(
      (category) =>
        category.surface === surface &&
        selections[category.id]?.disabled === false,
    )
    .map((category) => category.id);
}

export function withoutShare(selection: DraftSelection): DraftSelection {
  const { areaShare: _areaShare, ...rest } = selection;
  return rest;
}

function patchRoom(
  draft: DraftV1,
  roomClientId: string,
  update: (room: DraftRoom) => Selections,
): DraftV1 {
  return {
    ...draft,
    rooms: draft.rooms.map((room) =>
      room.clientId === roomClientId
        ? { ...room, selections: update(room) }
        : room,
    ),
  };
}

export function addCovering(
  draft: DraftV1,
  roomClientId: string,
  categoryId: string,
  categories: readonly SurfaceCategory[],
): DraftV1 {
  const surface = shareSurfaceOf(categories, categoryId);
  if (surface === null) {
    return draft;
  }
  return patchRoom(draft, roomClientId, (room) => {
    const { selections } = room;
    const current = selections[categoryId];
    if (isSharedCovering(current)) {
      return selections;
    }
    const others = enabledOnSurface(selections, categories, surface).filter(
      (id) => id !== categoryId,
    );
    const result: Selections = {
      ...selections,
      [categoryId]: {
        productId: current?.productId ?? null,
        source: current?.source ?? 'manual',
        disabled: false,
      },
    };
    if (others.length === 0) {
      return result;
    }
    const shared = others.filter(
      (id) => selections[id]?.areaShare !== undefined,
    );
    if (shared.length === 0) {
      for (const id of others) {
        result[id] = { ...(selections[id] as DraftSelection), areaShare: 50 };
      }
      result[categoryId] = { ...result[categoryId], areaShare: 50 };
      return result;
    }
    const shareOf = (id: string) => selections[id]?.areaShare ?? 0;
    const allocated = shared.reduce((sum, id) => sum + shareOf(id), 0);
    if (allocated < 100) {
      result[categoryId] = {
        ...result[categoryId],
        areaShare: 100 - allocated,
      };
      return result;
    }
    const donor = [...shared]
      .sort((a, b) => shareOf(b) - shareOf(a))
      .find((id) => shareOf(id) >= 2);
    if (donor === undefined) {
      result[categoryId] = { ...result[categoryId], areaShare: 1 };
      return result;
    }
    const taken = Math.floor(shareOf(donor) / 2);
    result[donor] = {
      ...(selections[donor] as DraftSelection),
      areaShare: shareOf(donor) - taken,
    };
    result[categoryId] = { ...result[categoryId], areaShare: taken };
    return result;
  });
}

export function setAreaShare(
  draft: DraftV1,
  roomClientId: string,
  categoryId: string,
  percent: number,
): DraftV1 {
  const areaShare = Math.min(100, Math.max(1, Math.round(percent)));
  return patchRoom(draft, roomClientId, (room) => {
    const current = room.selections[categoryId];
    return current
      ? { ...room.selections, [categoryId]: { ...current, areaShare } }
      : room.selections;
  });
}

export function dropCoveringShare(
  selections: Selections,
  categories: readonly SurfaceCategory[],
  categoryId: string,
): Selections {
  const current = selections[categoryId];
  if (!current) {
    return selections;
  }
  const result: Selections = {
    ...selections,
    [categoryId]: { ...withoutShare(current), disabled: true },
  };
  const surface = shareSurfaceOf(categories, categoryId);
  if (surface === null) {
    return result;
  }
  const remaining = enabledOnSurface(result, categories, surface);
  if (remaining.length === 1) {
    const [only] = remaining as [string];
    result[only] = withoutShare(result[only] as DraftSelection);
  }
  return result;
}

export function removeCovering(
  draft: DraftV1,
  roomClientId: string,
  categoryId: string,
  categories: readonly SurfaceCategory[],
): DraftV1 {
  return patchRoom(draft, roomClientId, (room) =>
    dropCoveringShare(room.selections, categories, categoryId),
  );
}
