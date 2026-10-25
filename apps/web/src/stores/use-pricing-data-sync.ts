'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { catalogRoots } from '@/lib/api/catalog';
import { checkPricingData, usePricingData } from './pricing-data';

export const PRICING_DATA_RECHECK_MS = 30_000;

const PRICED_QUERY_KEYS = [
  catalogRoots.products,
  catalogRoots.product,
  catalogRoots.engineering,
] as const;

export function usePricingDataSync(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    void checkPricingData();

    function onVisibilityChange() {
      if (document.visibilityState !== 'visible') {
        return;
      }
      const { checkedAt } = usePricingData.getState();
      if (
        checkedAt === null ||
        Date.now() - checkedAt > PRICING_DATA_RECHECK_MS
      ) {
        void checkPricingData();
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange);
    const unsubscribe = usePricingData.subscribe((state, previous) => {
      if (state.priceUpdate && state.priceUpdate !== previous.priceUpdate) {
        for (const key of PRICED_QUERY_KEYS) {
          void queryClient.invalidateQueries({ queryKey: [key] });
        }
      }
    });
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      unsubscribe();
    };
  }, [queryClient]);
}
