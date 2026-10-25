import type { StepId } from '@/lib/draft/schema';

export const CONFIGURATOR_PATH = '/configurator';

export const STEP_PATHS = {
  object: `${CONFIGURATOR_PATH}/object`,
  style: `${CONFIGURATOR_PATH}/style`,
  interior: `${CONFIGURATOR_PATH}/interior`,
  engineering: `${CONFIGURATOR_PATH}/engineering`,
  result: `${CONFIGURATOR_PATH}/result`,
} as const satisfies Record<StepId, string>;
