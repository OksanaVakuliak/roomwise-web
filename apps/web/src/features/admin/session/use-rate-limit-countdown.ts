'use client';

import { useEffect, useState } from 'react';

const SECOND_MS = 1000;

export function useRateLimitCountdown(seconds: number): number {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    if (seconds <= 0) return;
    const deadline = Date.now() + seconds * SECOND_MS;
    const timer = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil((deadline - Date.now()) / SECOND_MS),
      );
      setLeft(remaining);
      if (remaining === 0) clearInterval(timer);
    }, SECOND_MS);
    return () => {
      clearInterval(timer);
      setLeft(null);
    };
  }, [seconds]);

  return seconds <= 0 ? 0 : (left ?? seconds);
}
