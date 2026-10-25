'use client';

import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { Button } from '@/components/ui';
import { STEP_PATHS } from '@/config/routes';
import { useRouter } from '@/i18n/navigation';
import type { StepId } from '@/lib/draft/schema';
import {
  isStepComplete,
  nextStep,
  STEP_ORDER,
  type StepContext,
  stepIndex,
} from '@/lib/draft/steps';
import { useDraft } from '@/stores/draft';
import { useRunStepValidation } from '../StepValidation/step-validation-context';
import styles from './StepNav.module.css';

export type StepNavProps = {
  step: StepId;
  context: StepContext | null;
};

export function StepNav({ step, context }: StepNavProps) {
  const t = useTranslations('Configurator');
  const router = useRouter();
  const setStep = useDraft((state) => state.setStep);
  const runValidation = useRunStepValidation();
  const next = nextStep(step);

  const goBack = useCallback(() => {
    const previous = STEP_ORDER[stepIndex(step) - 1];
    router.push(previous ? STEP_PATHS[previous] : '/');
  }, [router, step]);

  const goNext = useCallback(() => {
    if (next === null) {
      return;
    }
    const invalidFieldId = runValidation();
    if (invalidFieldId !== null) {
      document.getElementById(invalidFieldId)?.focus();
      return;
    }
    if (!context || !isStepComplete(step, useDraft.getState(), context)) {
      return;
    }
    setStep(next);
    router.push(STEP_PATHS[next]);
  }, [context, next, router, runValidation, setStep, step]);

  return (
    <div className={styles.root}>
      <Button kind="outline" onClick={goBack}>
        {t('back')}
      </Button>
      {next === null ? null : (
        <Button kind="fill" onClick={goNext}>
          {t('next')}
        </Button>
      )}
    </div>
  );
}
