'use client';

import { useEffect } from 'react';
import { DRAFT_STORAGE_KEY, useDraft } from './draft';

export function useDraftTabSync(): void {
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === DRAFT_STORAGE_KEY || event.key === null) {
        void useDraft.persist.rehydrate();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
}
