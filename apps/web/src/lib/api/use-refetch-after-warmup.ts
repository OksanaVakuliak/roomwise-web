'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useWarmup } from '@/lib/warmup';

export function useRefetchAfterWarmup(): void {
  const queryClient = useQueryClient();

  useEffect(
    () =>
      useWarmup.subscribe((state, previous) => {
        if (state.server !== 'ready' || previous.server === 'ready') {
          return;
        }
        void queryClient.refetchQueries({
          type: 'active',
          predicate: (query) => query.state.status === 'error',
        });
      }),
    [queryClient],
  );
}
