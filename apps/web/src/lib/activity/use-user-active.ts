'use client';

import { useEffect, useState } from 'react';

const ACTIVITY_EVENTS = [
  'pointerdown',
  'pointermove',
  'keydown',
  'wheel',
  'touchstart',
] as const;

export function useUserActive(idleMs: number): boolean {
  const [active, setActive] = useState(true);

  useEffect(() => {
    let timer = setTimeout(() => setActive(false), idleMs);
    const onActivity = () => {
      clearTimeout(timer);
      setActive(true);
      timer = setTimeout(() => setActive(false), idleMs);
    };
    for (const type of ACTIVITY_EVENTS) {
      window.addEventListener(type, onActivity, { passive: true });
    }
    return () => {
      clearTimeout(timer);
      for (const type of ACTIVITY_EVENTS) {
        window.removeEventListener(type, onActivity);
      }
    };
  }, [idleMs]);

  return active;
}
