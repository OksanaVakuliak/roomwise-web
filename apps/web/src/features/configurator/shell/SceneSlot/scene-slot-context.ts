'use client';

import { createContext, useContext } from 'react';

export const SceneSlotContext = createContext<HTMLElement | null>(null);

export function useSceneSlot(): HTMLElement | null {
  return useContext(SceneSlotContext);
}
