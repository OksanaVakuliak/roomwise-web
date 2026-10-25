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
