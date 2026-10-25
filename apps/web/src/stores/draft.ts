import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  DRAFT_VERSION,
  type DraftMigration,
  migrate as migrateDraft,
} from '@/lib/draft/migrate';
import {
  createDefaultDraft,
  type DraftV1,
  DraftV1Schema,
  type StepId,
  StepIdSchema,
} from '@/lib/draft/schema';
import { createSafeStorage } from './safe-storage';

export const DRAFT_STORAGE_KEY = 'roomwise-draft';

export type DraftNotice = NonNullable<DraftMigration['notice']>;

type DraftState = DraftV1 & {
  revision: number;
  storageAvailable: boolean;
  notice: DraftNotice | null;
  setStep: (step: StepId) => void;
  reset: () => void;
  dismissNotice: () => void;
};

let pendingNotice: DraftNotice | null = null;

function stepIndex(step: StepId): number {
  return StepIdSchema.options.indexOf(step);
}

function markStorageUnavailable() {
  if (useDraft.getState().storageAvailable) {
    useDraft.setState({ storageAvailable: false });
  }
}

export const useDraft = create<DraftState>()(
  persist(
    (set) => ({
      ...createDefaultDraft(),
      revision: 0,
      storageAvailable: true,
      notice: null,
      setStep: (step) =>
        set((state) => ({
          step,
          furthestStep:
            stepIndex(step) > stepIndex(state.furthestStep)
              ? step
              : state.furthestStep,
          revision: state.revision + 1,
        })),
      reset: () =>
        set((state) => ({
          ...createDefaultDraft(),
          revision: state.revision + 1,
        })),
      dismissNotice: () => set({ notice: null }),
    }),
    {
      name: DRAFT_STORAGE_KEY,
      storage: createJSONStorage(() =>
        createSafeStorage(markStorageUnavailable),
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
          return { ...current, notice: null };
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
