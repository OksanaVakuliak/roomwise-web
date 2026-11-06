'use client';

import { useRefetchAfterWarmup } from '@/lib/api/use-refetch-after-warmup';
import { useWarmupStart } from '@/lib/warmup';

export function WarmupStarter() {
  useWarmupStart();
  useRefetchAfterWarmup();
  return null;
}
