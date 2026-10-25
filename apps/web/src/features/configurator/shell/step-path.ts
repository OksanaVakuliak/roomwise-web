import { STEP_PATHS } from '@/config/routes';
import type { StepId } from '@/lib/draft/schema';
import { STEP_ORDER } from '@/lib/draft/steps';

export function stepFromPath(pathname: string): StepId | null {
  return STEP_ORDER.find((step) => STEP_PATHS[step] === pathname) ?? null;
}

export const STEP_LABEL_KEYS = {
  object: 'steps.1',
  style: 'steps.2',
  interior: 'steps.3',
  engineering: 'steps.4',
  result: 'steps.5',
} as const satisfies Record<StepId, string>;

export const STEP_NUMBERS = {
  object: 'A1',
  style: 'A2',
  interior: 'A3',
  engineering: 'A4',
  result: 'A5',
} as const satisfies Record<StepId, string>;
