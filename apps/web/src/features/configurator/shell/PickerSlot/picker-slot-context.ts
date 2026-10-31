'use client';

import { createContext, useContext } from 'react';

export const PickerSlotContext = createContext<HTMLElement | null>(null);

export function usePickerSlot(): HTMLElement | null {
  return useContext(PickerSlotContext);
}
