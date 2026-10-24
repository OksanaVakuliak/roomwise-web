'use client';

import { useEffect } from 'react';
import { installNetworkListeners, startWarmup } from './warmup';

export function useWarmupStart(): void {
  useEffect(() => {
    const removeListeners = installNetworkListeners();
    startWarmup();
    return removeListeners;
  }, []);
}
