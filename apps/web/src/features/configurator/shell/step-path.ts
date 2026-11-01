import { STEP_PATHS } from '@/config/routes';
import type { StepId } from '@/lib/draft/schema';
import { STEP_ORDER } from '@/lib/draft/steps';

export function stepFromPath(pathname: string): StepId | null {
  return STEP_ORDER.find((step) => STEP_PATHS[step] === pathname) ?? null;
}

export const STEP_LABEL_KEYS = {
  object: 'steps.1',
  engineering: 'steps.2',
  style: 'steps.3',
  interior: 'steps.4',
  result: 'steps.5',
} as const satisfies Record<StepId, string>;

export const STEP_NUMBERS = {
  object: 'A1',
  engineering: 'A2',
  style: 'A3',
  interior: 'A4',
  result: 'A5',
} as const satisfies Record<StepId, string>;
