'use client';

import { type RefObject, useEffect, useRef, useState } from 'react';
import { useIsDesktop } from '@/lib/media/use-media-query';

export function usePinnedAside(): {
  asideRef: RefObject<HTMLDivElement | null>;
  showcaseRef: RefObject<HTMLElement | null>;
  costRef: RefObject<HTMLElement | null>;
  pinned: boolean;
} {
  const asideRef = useRef<HTMLDivElement>(null);
  const showcaseRef = useRef<HTMLElement>(null);
  const costRef = useRef<HTMLElement>(null);
  const isDesktop = useIsDesktop();
  const [fits, setFits] = useState(false);

  useEffect(() => {
    const aside = asideRef.current;
    const showcase = showcaseRef.current;
    const cost = costRef.current;
    if (!isDesktop || !aside || !showcase || !cost) {
      setFits(false);
      return;
    }
    const measure = () => {
      const style = getComputedStyle(aside);
      const padding =
        (Number.parseFloat(style.paddingTop) || 0) +
        (Number.parseFloat(style.paddingBottom) || 0);
      const container = aside.parentElement;
      const offset = container
        ? container.getBoundingClientRect().top + window.scrollY
        : 0;
      setFits(
        offset + showcase.offsetHeight + cost.offsetHeight + padding <=
          window.innerHeight,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(showcase);
    observer.observe(cost);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [isDesktop]);

  return { asideRef, showcaseRef, costRef, pinned: isDesktop && fits };
}
