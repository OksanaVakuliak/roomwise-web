'use client';

import { useTranslations } from 'next-intl';
import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { NoticeStack } from '@/components/layout';
import { Toast } from '@/components/ui';
import { STEP_PATHS } from '@/config/routes';
import { useRouter } from '@/i18n/navigation';
import type { DraftV1, StepId } from '@/lib/draft/schema';
import {
  canOpen,
  firstIncomplete,
  STEP_ORDER,
  type StepContext,
  stepIndex,
} from '@/lib/draft/steps';
import { useDraft } from '@/stores/draft';
import { STEP_LABEL_KEYS } from '../step-path';

export type StepGuardProps = {
  step: StepId;
  context: StepContext | null;
  children: ReactNode;
};

type Redirect = { target: StepId; reason: 'incomplete' | 'order' };

function resolveRedirect(draft: DraftV1, context: StepContext): Redirect {
  const reachable = firstIncomplete(draft, context) ?? 'result';
  const sequential = STEP_ORDER[stepIndex(draft.furthestStep) + 1] ?? 'result';
  return stepIndex(sequential) < stepIndex(reachable)
    ? { target: sequential, reason: 'order' }
    : { target: reachable, reason: 'incomplete' };
}

export function StepGuard({ step, context, children }: StepGuardProps) {
  const t = useTranslations('Configurator');
  const tShell = useTranslations('ConfiguratorShell');
  const router = useRouter();
  const draft = useDraft();
  const setStep = useDraft((state) => state.setStep);
  const [notice, setNotice] = useState<Redirect | null>(null);

  const dismiss = useCallback(() => setNotice(null), []);

  const blocked = context !== null && !canOpen(step, draft, context);
  const redirect = blocked ? resolveRedirect(draft, context) : null;
  const target = redirect?.target;
  const reason = redirect?.reason;

  useEffect(() => {
    if (target && reason) {
      setNotice({ target, reason });
      router.replace(STEP_PATHS[target]);
    }
  }, [target, reason, router]);

  useEffect(() => {
    if (!blocked && useDraft.getState().step !== step) {
      setStep(step);
    }
  }, [blocked, step, setStep]);

  return (
    <>
      {blocked ? null : <>{children}</>}
      {notice ? (
        <NoticeStack>
          <Toast dismissLabel={tShell('dismiss')} onDismiss={dismiss}>
            {tShell(
              notice.reason === 'incomplete' ? 'guardIncomplete' : 'guardOrder',
              { step: t(STEP_LABEL_KEYS[notice.target]) },
            )}
          </Toast>
        </NoticeStack>
      ) : null}
    </>
  );
}
