'use client';

import { type RefObject, useEffect, useState } from 'react';
import type { SceneColors } from './types';

export function readSceneColors(element: HTMLElement): SceneColors {
  const style = getComputedStyle(element);
  const token = (name: string) => style.getPropertyValue(name).trim();
  return {
    background: token('--paper'),
    neutral: token('--paint'),
    edge: token('--line'),
  };
}

export function useSceneColors(
  ref: RefObject<HTMLElement | null>,
  enabled = true,
): SceneColors | null {
  const [colors, setColors] = useState<SceneColors | null>(null);

  useEffect(() => {
    if (enabled && ref.current) setColors(readSceneColors(ref.current));
  }, [ref, enabled]);

  useEffect(() => {
    if (!enabled) return;
    const observer = new MutationObserver(() => {
      if (ref.current) setColors(readSceneColors(ref.current));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, [ref, enabled]);

  return colors;
}
