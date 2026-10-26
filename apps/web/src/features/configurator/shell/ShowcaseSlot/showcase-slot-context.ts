'use client';

import { createContext, useContext } from 'react';

export const ShowcaseSlotContext = createContext<HTMLElement | null>(null);

export function useShowcaseSlot(): HTMLElement | null {
  return useContext(ShowcaseSlotContext);
}
