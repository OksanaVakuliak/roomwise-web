'use client';

import { useEffect, useState } from 'react';
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

function sameColors(a: SceneColors | null, b: SceneColors): boolean {
  return (
    a !== null &&
    a.background === b.background &&
    a.neutral === b.neutral &&
    a.edge === b.edge
  );
}

export function useSceneColors(
  element: HTMLElement | null,
  enabled = true,
): SceneColors | null {
  const [colors, setColors] = useState<SceneColors | null>(null);

  useEffect(() => {
    if (!enabled || !element) return;
    const update = () => {
      const next = readSceneColors(element);
      setColors((previous) => (sameColors(previous, next) ? previous : next));
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, [element, enabled]);

  return colors;
}
