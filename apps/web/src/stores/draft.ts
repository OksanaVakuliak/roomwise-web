import type { PricingData } from '@roomwise/calc-engine';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import {
  DRAFT_VERSION,
  type DraftMigration,
  migrate as migrateDraft,
} from '@/lib/draft/migrate';
import {
  addRoom as addDraftRoom,
  createRoom,
  removeRoom as removeDraftRoom,
  renameRoom as renameDraftRoom,
} from '@/lib/draft/rooms';
import {
  createDefaultDraft,
  type DraftRoom,
  type DraftV1,
  DraftV1Schema,
  type StepId,
} from '@/lib/draft/schema';
import {
  disableCategory as disableDraftCategory,
  enableCategory as enableDraftCategory,
  selectProduct as selectDraftProduct,
} from '@/lib/draft/selections';
import { stepIndex } from '@/lib/draft/steps';
import {
  applyStyle,
  type DefaultMaterials,
  materialsForRoom,
  type RoomCatalog,
  type RoomTypesCatalog,
  retypeSelections,
} from '@/lib/draft/style';
import { normalizeDraft } from '@/lib/draft/surfaces';
import { isHeatedFloorAllowed } from '@/lib/engine/heated-floor';
import { createSafeStorage } from './safe-storage';

export const DRAFT_STORAGE_KEY = 'roomwise-draft';

export type DraftNotice = NonNullable<DraftMigration['notice']>;

type DraftState = DraftV1 & {
  revision: number;
  storageAvailable: boolean;
  notice: DraftNotice | null;
  heatedFloorReset: boolean;
  setStep: (step: StepId) => void;
  setObject: (patch: Partial<DraftV1['object']>) => void;
  selectStyle: (
    defaultMaterials: DefaultMaterials,
    roomTypes: RoomTypesCatalog,
  ) => void;
  clearStyle: () => void;
  addRoom: (catalog?: RoomCatalog) => string | null;
  updateRoom: (
    clientId: string,
    patch: Partial<
      Pick<DraftRoom, 'roomTypeCode' | 'lengthM' | 'widthM' | 'heightM'>
    >,
    catalog?: RoomCatalog,
    heatedFloorOption?: PricingData['options'][number],
  ) => void;
  setHeatedFloor: (clientId: string, on: boolean) => void;
  toggleRoomOption: (optionId: string, clientId: string) => void;
  renameRoom: (clientId: string, name: string) => void;
  removeRoom: (clientId: string) => void;
  selectProduct: (
    roomClientId: string,
    categoryId: string,
    productId: string,
    siblingIds?: readonly string[],
  ) => void;
  disableCategory: (roomClientId: string, categoryId: string) => void;
  enableCategory: (
    roomClientId: string,
    categoryId: string,
    siblingIds?: readonly string[],
  ) => void;
  normalizeSurfaces: (roomTypes: RoomTypesCatalog) => void;
  reset: () => void;
  dismissNotice: () => void;
  dismissHeatedFloorReset: () => void;
};

let pendingNotice: DraftNotice | null = null;

const DRAFT_KEYS = Object.keys(DraftV1Schema.shape) as (keyof DraftV1)[];

function pickDraft(state: DraftV1): DraftV1 {
  return Object.fromEntries(
    DRAFT_KEYS.map((key) => [key, state[key]]),
  ) as DraftV1;
}

function markStorageCorrupt() {
  pendingNotice = 'draftReset';
}

function markStorageUnavailable() {
  if (useDraft.getState().storageAvailable) {
    useDraft.setState({ storageAvailable: false });
  }
}

export const useDraft = create<DraftState>()(
  persist(
    (set, get) => ({
      ...createDefaultDraft(),
      revision: 0,
      storageAvailable: true,
      notice: null,
      heatedFloorReset: false,
      setStep: (step) =>
        set((state) => ({
          step,
          furthestStep:
            stepIndex(step) > stepIndex(state.furthestStep)
              ? step
              : state.furthestStep,
          revision: state.revision + 1,
        })),
      setObject: (patch) =>
        set((state) => ({
          object: { ...state.object, ...patch },
          revision: state.revision + 1,
        })),
      selectStyle: (defaultMaterials, roomTypes) =>
        set((state) => ({
          ...applyStyle(pickDraft(state), defaultMaterials, roomTypes),
          revision: state.revision + 1,
        })),
      clearStyle: () =>
        set((state) => ({ styleId: null, revision: state.revision + 1 })),
      addRoom: (catalog) => {
        const draft = pickDraft(get());
        const created = createRoom(draft);
        const room =
          catalog?.defaultMaterials && draft.styleId !== null
            ? {
                ...created,
                selections: materialsForRoom(
                  created.roomTypeCode,
                  catalog.defaultMaterials,
                  catalog.roomTypes,
                ),
              }
            : created;
        const next = addDraftRoom(draft, room);
        if (next === draft) {
          return null;
        }
        set((state) => ({ ...next, revision: state.revision + 1 }));
        return room.clientId;
      },
      updateRoom: (clientId, patch, catalog, heatedFloorOption) =>
        set((state) => {
          let heatedFloorReset = false;
          const rooms = state.rooms.map((room) => {
            if (room.clientId !== clientId) {
              return room;
            }
            let next = { ...room, ...patch };
            if (
              room.heatedFloor &&
              heatedFloorOption !== undefined &&
              patch.roomTypeCode !== undefined &&
              (patch.roomTypeCode === null ||
                !isHeatedFloorAllowed(heatedFloorOption, patch.roomTypeCode))
            ) {
              next = { ...next, heatedFloor: false };
              heatedFloorReset = true;
            }
            if (
              !catalog ||
              patch.roomTypeCode === undefined ||
              patch.roomTypeCode === room.roomTypeCode
            ) {
              return next;
            }
            return {
              ...next,
              selections: retypeSelections(
                room.selections,
                patch.roomTypeCode,
                state.styleId === null ? null : catalog.defaultMaterials,
                catalog.roomTypes,
              ),
            };
          });
          return {
            rooms,
            heatedFloorReset: heatedFloorReset || state.heatedFloorReset,
            revision: state.revision + 1,
          };
        }),
      setHeatedFloor: (clientId, on) =>
        set((state) => ({
          rooms: state.rooms.map((room) =>
            room.clientId === clientId ? { ...room, heatedFloor: on } : room,
          ),
          revision: state.revision + 1,
        })),
      toggleRoomOption: (optionId, clientId) =>
        set((state) => {
          const { [optionId]: current, ...others } = state.options;
          const ids = current?.roomClientIds ?? [];
          const next = ids.includes(clientId)
            ? ids.filter((id) => id !== clientId)
            : [...ids, clientId];
          return {
            options:
              next.length === 0
                ? others
                : {
                    ...others,
                    [optionId]: { ...current, roomClientIds: next },
                  },
            revision: state.revision + 1,
          };
        }),
      renameRoom: (clientId, name) =>
        set((state) => ({
          ...renameDraftRoom(pickDraft(state), clientId, name),
          revision: state.revision + 1,
        })),
      removeRoom: (clientId) =>
        set((state) => ({
          ...removeDraftRoom(pickDraft(state), clientId),
          revision: state.revision + 1,
        })),
      selectProduct: (roomClientId, categoryId, productId, siblingIds) =>
        set((state) => ({
          ...selectDraftProduct(
            pickDraft(state),
            roomClientId,
            categoryId,
            productId,
            siblingIds,
          ),
          revision: state.revision + 1,
        })),
      disableCategory: (roomClientId, categoryId) =>
        set((state) => ({
          ...disableDraftCategory(pickDraft(state), roomClientId, categoryId),
          revision: state.revision + 1,
        })),
      enableCategory: (roomClientId, categoryId, siblingIds) =>
        set((state) => ({
          ...enableDraftCategory(
            pickDraft(state),
            roomClientId,
            categoryId,
            siblingIds,
          ),
          revision: state.revision + 1,
        })),
      normalizeSurfaces: (roomTypes) => {
        const draft = pickDraft(get());
        const next = normalizeDraft(draft, roomTypes);
        if (next !== draft) {
          set((state) => ({ ...next, revision: state.revision + 1 }));
        }
      },
      reset: () =>
        set((state) => ({
          ...createDefaultDraft(),
          revision: state.revision + 1,
        })),
      dismissNotice: () => set({ notice: null }),
      dismissHeatedFloorReset: () => set({ heatedFloorReset: false }),
    }),
    {
      name: DRAFT_STORAGE_KEY,
      storage: createJSONStorage(() =>
        createSafeStorage(markStorageUnavailable, markStorageCorrupt),
      ),
      version: DRAFT_VERSION,
      skipHydration: true,
      partialize: (state): DraftV1 => ({
        step: state.step,
        furthestStep: state.furthestStep,
        object: state.object,
        rooms: state.rooms,
        styleId: state.styleId,
        options: state.options,
        lastSaved: state.lastSaved,
      }),
      migrate: (persisted, fromVersion) => {
        const { draft, notice } = migrateDraft(persisted, fromVersion);
        pendingNotice = notice ?? null;
        return draft;
      },
      merge: (persisted, current) => {
        const notice = pendingNotice;
        pendingNotice = null;
        if (persisted == null) {
          return { ...current, notice };
        }
        const parsed = DraftV1Schema.safeParse(persisted);
        const result = parsed.success
          ? { draft: parsed.data, notice: notice ?? undefined }
          : migrateDraft(persisted, DRAFT_VERSION);
        return {
          ...current,
          ...result.draft,
          notice: result.notice ?? null,
          revision: current.revision + 1,
        };
      },
    },
  ),
);

export function useDraftValue(): DraftV1 {
  return useDraft(useShallow(pickDraft));
}
