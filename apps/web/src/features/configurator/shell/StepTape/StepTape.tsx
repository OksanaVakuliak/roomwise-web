'use client';

import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { TapeRule, TapeStep, type TapeStepState } from '@/components/ui';
import { STEP_PATHS } from '@/config/routes';
import { useRouter } from '@/i18n/navigation';
import type { StepId } from '@/lib/draft/schema';
import {
  canOpen,
  STEP_ORDER,
  type StepContext,
  stepState,
} from '@/lib/draft/steps';
import { useDraftValue } from '@/stores/draft';
import { STEP_LABEL_KEYS, STEP_NUMBERS } from '../step-path';

export type StepTapeProps = {
  current: StepId;
  context: StepContext | null;
};

type TapeItemProps = {
  step: StepId;
  state: TapeStepState;
  available: boolean;
};

function TapeItem({ step, state, available }: TapeItemProps) {
  const t = useTranslations('Configurator');
  const router = useRouter();
  const open = useCallback(() => router.push(STEP_PATHS[step]), [router, step]);

  return (
    <TapeStep
      size="responsive"
      number={STEP_NUMBERS[step]}
      label={t(STEP_LABEL_KEYS[step])}
      state={state}
      stateLabel={t(`state.${state}`)}
      available={available}
      onClick={open}
    />
  );
}

export function StepTape({ current, context }: StepTapeProps) {
  const t = useTranslations('Configurator');
  const draft = useDraftValue();
  const view = { ...draft, step: current };

  return (
    <TapeRule size="responsive" label={t('tapeLabel')}>
      {STEP_ORDER.map((step) => {
        let state: TapeStepState = step === current ? 'now' : 'later';
        if (context) {
          state = stepState(step, view, context);
        }
        const available =
          step === current ||
          (context !== null && canOpen(step, view, context));

        return (
          <TapeItem
            key={step}
            step={step}
            state={state}
            available={available}
          />
        );
      })}
    </TapeRule>
  );
}
