import type { DraftV1 } from './schema';

export type FinishLevel = NonNullable<DraftV1['object']['finishLevel']>;

export const FINISH_LABEL = {
  ROUGH: 'finishRough',
  PRE_FINISH: 'finishPre',
  LIVED_IN: 'finishLivedIn',
} as const satisfies Record<FinishLevel, string>;
