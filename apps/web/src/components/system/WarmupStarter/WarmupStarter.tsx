'use client';

import { useWarmupStart } from '@/lib/warmup';

export function WarmupStarter() {
  useWarmupStart();
  return null;
}
