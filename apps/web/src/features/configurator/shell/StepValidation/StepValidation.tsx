'use client';

import { type ReactNode, useRef } from 'react';
import {
  StepValidationContext,
  type StepValidator,
} from './step-validation-context';

export function StepValidationProvider({ children }: { children: ReactNode }) {
  const validator = useRef<StepValidator | null>(null);

  return (
    <StepValidationContext value={validator}>{children}</StepValidationContext>
  );
}
