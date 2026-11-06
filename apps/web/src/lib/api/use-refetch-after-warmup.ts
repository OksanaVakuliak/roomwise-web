'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useWarmup } from '@/lib/warmup';
import { checkPricingData, usePricingData } from '@/stores/pricing-data';

export function useRefetchAfterWarmup(): void {
  const queryClient = useQueryClient();

  useEffect(
    () =>
      useWarmup.subscribe((state, previous) => {
        if (state.server !== 'ready' || previous.server === 'ready') {
          return;
        }
        void queryClient.refetchQueries({
          predicate: (query) => query.state.status === 'error',
        });
        if (usePricingData.getState().status === 'error') {
          void checkPricingData();
        }
      }),
    [queryClient],
  );
}
