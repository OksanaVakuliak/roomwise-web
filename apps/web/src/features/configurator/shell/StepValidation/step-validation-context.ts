'use client';

import {
  createContext,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react';

export type StepValidator = () => string | null;

export const StepValidationContext =
  createContext<RefObject<StepValidator | null> | null>(null);

export function useStepValidation(validate: StepValidator): void {
  const registry = useContext(StepValidationContext);
  const latest = useRef(validate);

  useEffect(() => {
    latest.current = validate;
  });

  useEffect(() => {
    if (!registry) {
      return;
    }
    registry.current = () => latest.current();
    return () => {
      registry.current = null;
    };
  }, [registry]);
}

export function useRunStepValidation(): StepValidator {
  const registry = useContext(StepValidationContext);

  return useCallback(() => registry?.current?.() ?? null, [registry]);
}
