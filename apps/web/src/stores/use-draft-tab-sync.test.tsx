import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDefaultDraft } from '@/lib/draft/schema';
import { resetThemeDom } from '@/lib/theme/test-utils';
import { DRAFT_STORAGE_KEY, useDraft } from './draft';
import { useDraftTabSync } from './use-draft-tab-sync';

const fromOtherTab = (key: string | null) =>
  act(() => {
    window.dispatchEvent(new StorageEvent('storage', { key }));
  });

beforeEach(() => {
  vi.restoreAllMocks();
  resetThemeDom();
  useDraft.setState({ ...createDefaultDraft(), revision: 0 });
});

describe('useDraftTabSync', () => {
  it('applies a change made in another tab', async () => {
    renderHook(() => useDraftTabSync());
    window.localStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({
        state: { ...createDefaultDraft(), step: 'interior' },
        version: 1,
      }),
    );

    fromOtherTab(DRAFT_STORAGE_KEY);

    await vi.waitFor(() => expect(useDraft.getState().step).toBe('interior'));
  });

  it('ignores other keys', () => {
    renderHook(() => useDraftTabSync());
    const rehydrate = vi.spyOn(useDraft.persist, 'rehydrate');

    fromOtherTab('roomwise-preferences');

    expect(rehydrate).not.toHaveBeenCalled();
  });

  it('does not rehydrate on its own writes', () => {
    renderHook(() => useDraftTabSync());
    const rehydrate = vi.spyOn(useDraft.persist, 'rehydrate');

    useDraft.getState().setStep('style');

    expect(rehydrate).not.toHaveBeenCalled();
  });

  it('stops listening after unmount', () => {
    const { unmount } = renderHook(() => useDraftTabSync());
    const rehydrate = vi.spyOn(useDraft.persist, 'rehydrate');
    unmount();

    fromOtherTab(DRAFT_STORAGE_KEY);

    expect(rehydrate).not.toHaveBeenCalled();
  });
});
