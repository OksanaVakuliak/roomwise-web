'use client';

import { type RefObject, useEffect, useRef, useState } from 'react';
import { useIsDesktop } from '@/lib/media/use-media-query';

export function useAsideOffset(): {
  asideRef: RefObject<HTMLDivElement | null>;
  offset: number | null;
} {
  const asideRef = useRef<HTMLDivElement>(null);
  const isDesktop = useIsDesktop();
  const [offset, setOffset] = useState<number | null>(null);

  useEffect(() => {
    const container = asideRef.current?.parentElement;
    if (!isDesktop || !container) {
      setOffset(null);
      return;
    }
    let frame = 0;
    const measure = () => {
      frame = 0;
      setOffset(Math.max(0, Math.round(container.getBoundingClientRect().top)));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [isDesktop]);

  return { asideRef, offset };
}
