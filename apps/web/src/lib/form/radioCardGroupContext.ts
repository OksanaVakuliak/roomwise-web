'use client';

import { createContext } from 'react';

export type RadioCardGroupState = {
  required?: boolean;
  invalid?: boolean;
};

export const RadioCardGroupContext = createContext<RadioCardGroupState>({});
