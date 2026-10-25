'use client';

import { useEffect, useState } from 'react';
import { useDraft } from './draft';

let hydration: Promise<void> | undefined;

function hydrateOnce(): Promise<void> {
  hydration ??= Promise.resolve(useDraft.persist.rehydrate());
  return hydration;
}

export function useDraftHydration(): boolean {
  const [hydrated, setHydrated] = useState(() =>
    useDraft.persist.hasHydrated(),
  );

  useEffect(() => {
    let active = true;
    hydrateOnce().then(() => {
      if (active) {
        setHydrated(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return hydrated;
}
