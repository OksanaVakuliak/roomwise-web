'use client';

import { useMemo } from 'react';
import { useStyles } from '@/lib/api/catalog';
import type { StepContext } from '@/lib/draft/steps';
import { usePricingData } from '@/stores/pricing-data';

export type StepContextState =
  | { status: 'loading' }
  | { status: 'unavailable' }
  | { status: 'ready'; context: StepContext };

export function useStepContext(): StepContextState {
  const limits = usePricingData((state) => state.data?.limits);
  const pricingStatus = usePricingData((state) => state.status);
  const styles = useStyles();
  const styleIds = useMemo(
    () => styles.data?.items.map((style) => style.id),
    [styles.data],
  );

  return useMemo<StepContextState>(() => {
    if (limits && styleIds) {
      return { status: 'ready', context: { limits, styleIds } };
    }
    if ((!limits && pricingStatus === 'error') || styles.isError) {
      return { status: 'unavailable' };
    }
    return { status: 'loading' };
  }, [limits, styleIds, pricingStatus, styles.isError]);
}
