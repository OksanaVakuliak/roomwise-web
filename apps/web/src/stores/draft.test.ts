import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDefaultDraft } from '@/lib/draft/schema';
import { breakStorage, resetThemeDom } from '@/lib/theme/test-utils';
import { DRAFT_STORAGE_KEY, useDraft } from './draft';

const stored = () => {
  const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
  return raw === null ? null : JSON.parse(raw);
};

const seed = (state: unknown, version = 1) =>
  window.localStorage.setItem(
    DRAFT_STORAGE_KEY,
    JSON.stringify({ state, version }),
  );

beforeEach(() => {
  vi.restoreAllMocks();
  resetThemeDom();
  useDraft.setState({
    ...createDefaultDraft(),
    revision: 0,
    storageAvailable: true,
    notice: null,
  });
});

describe('useDraft', () => {
  it('persists only the draft', () => {
    useDraft.getState().setStep('style');

    expect(stored()).toEqual({
      state: { ...createDefaultDraft(), step: 'style', furthestStep: 'style' },
      version: 1,
    });
  });

  it('keeps step and data after a reload', async () => {
    useDraft.setState({ styleId: 'modern' });
    useDraft.getState().setStep('interior');
    const saved = window.localStorage.getItem(DRAFT_STORAGE_KEY) ?? '';
    useDraft.setState(createDefaultDraft());
    window.localStorage.setItem(DRAFT_STORAGE_KEY, saved);

    await useDraft.persist.rehydrate();

    expect(useDraft.getState().step).toBe('interior');
    expect(useDraft.getState().styleId).toBe('modern');
    expect(useDraft.getState().notice).toBeNull();
  });

  it('does not move furthestStep back', () => {
    useDraft.getState().setStep('interior');
    useDraft.getState().setStep('object');

    expect(useDraft.getState().step).toBe('object');
    expect(useDraft.getState().furthestStep).toBe('interior');
  });

  it('increments revision on every change', () => {
    useDraft.getState().setStep('style');
    useDraft.getState().reset();

    expect(useDraft.getState().revision).toBe(2);
  });

  it('dismisses the notice without touching the draft revision', () => {
    useDraft.setState({ notice: 'draftReset' });
    useDraft.getState().dismissNotice();

    expect(useDraft.getState().notice).toBeNull();
    expect(useDraft.getState().revision).toBe(0);
  });

  it('resets to the default draft', () => {
    useDraft.getState().setStep('result');
    useDraft.getState().reset();

    expect(useDraft.getState().step).toBe('object');
    expect(stored().state).toEqual(createDefaultDraft());
  });

  it('salvages valid fields from a damaged draft of the same version', async () => {
    seed({
      ...createDefaultDraft(),
      step: 'style',
      furthestStep: 'style',
      rooms: 'garbage',
    });

    await useDraft.persist.rehydrate();

    expect(useDraft.getState().step).toBe('style');
    expect(useDraft.getState().rooms).toEqual([]);
    expect(useDraft.getState().notice).toBeNull();
  });

  it('resets with a notice when the stored draft is not valid JSON', async () => {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, '{"state":');

    await useDraft.persist.rehydrate();

    expect(useDraft.getState().step).toBe('object');
    expect(useDraft.getState().notice).toBe('draftReset');
  });

  it('resets with a notice when nothing can be recovered', async () => {
    seed({ nonsense: true });

    await useDraft.persist.rehydrate();

    expect(useDraft.getState().step).toBe('object');
    expect(useDraft.getState().notice).toBe('draftReset');
  });

  it('salvages a draft from a newer version', async () => {
    seed({ ...createDefaultDraft(), step: 'style', furthestStep: 'style' }, 7);

    await useDraft.persist.rehydrate();

    expect(useDraft.getState().step).toBe('style');
  });

  it('resets with a notice for an unrecoverable newer version', async () => {
    seed('junk', 7);

    await useDraft.persist.rehydrate();

    expect(useDraft.getState().notice).toBe('draftReset');
  });

  it('keeps working when storage is unavailable', async () => {
    breakStorage('getItem');
    breakStorage('setItem');

    useDraft.getState().setStep('style');
    await useDraft.persist.rehydrate();

    expect(useDraft.getState().step).toBe('style');
    expect(useDraft.getState().storageAvailable).toBe(false);
  });
});

describe('useDraft room actions', () => {
  const rooms = () => useDraft.getState().rooms;

  it('merges a patch into the object without touching rooms', () => {
    const id = useDraft.getState().addRoom();
    useDraft.getState().setObject({ totalAreaSqm: 60, gas: true });
    useDraft.getState().setObject({ kitchenType: 'KITCHEN_LIVING' });

    expect(useDraft.getState().object).toMatchObject({
      totalAreaSqm: 60,
      gas: true,
      kitchenType: 'KITCHEN_LIVING',
    });
    expect(rooms()).toHaveLength(1);
    expect(rooms()[0]?.clientId).toBe(id);
    expect(rooms()[0]?.roomTypeCode).toBe('LIVING_ROOM');
  });

  it('adds a room and returns its id', () => {
    const id = useDraft.getState().addRoom();

    expect(id).not.toBeNull();
    expect(rooms()).toHaveLength(1);
    expect(rooms()[0]).toMatchObject({ clientId: id, name: null });
    expect(useDraft.getState().revision).toBe(1);
  });

  it('returns null and changes nothing at the room limit', () => {
    for (let i = 0; i < 50; i++) {
      useDraft.getState().addRoom();
    }

    expect(useDraft.getState().addRoom()).toBeNull();
    expect(rooms()).toHaveLength(50);
  });

  it('updates only the patched fields of the given room', () => {
    const first = useDraft.getState().addRoom() as string;
    const second = useDraft.getState().addRoom() as string;
    useDraft.getState().updateRoom(second, {
      roomTypeCode: 'BATHROOM',
      lengthM: 3,
      widthM: 2,
      heightM: 2.7,
    });

    expect(rooms().find((r) => r.clientId === second)).toMatchObject({
      roomTypeCode: 'BATHROOM',
      lengthM: 3,
      widthM: 2,
      heightM: 2.7,
    });
    expect(rooms().find((r) => r.clientId === first)?.lengthM).toBeNull();
  });

  it('renames a room and clears a blank name', () => {
    const id = useDraft.getState().addRoom() as string;
    useDraft.getState().renameRoom(id, '  Study ');
    expect(rooms()[0]?.name).toBe('Study');

    useDraft.getState().renameRoom(id, '   ');
    expect(rooms()[0]?.name).toBeNull();
  });

  it('removes a room and cleans options that referenced it', () => {
    const first = useDraft.getState().addRoom() as string;
    const second = useDraft.getState().addRoom() as string;
    useDraft.setState({
      options: {
        only: { roomClientIds: [first] },
        both: { roomClientIds: [first, second] },
        global: { quantity: 2 },
      },
    });
    useDraft.getState().removeRoom(first);

    expect(rooms().map((r) => r.clientId)).toEqual([second]);
    expect(useDraft.getState().options).toEqual({
      both: { roomClientIds: [second] },
      global: { quantity: 2 },
    });
  });
});
