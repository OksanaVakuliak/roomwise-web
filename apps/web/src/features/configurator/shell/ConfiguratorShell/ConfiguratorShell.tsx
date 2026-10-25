'use client';

import type { ReactNode } from 'react';
import { StepLayout } from '@/components/layout';
import { ZoneSkeleton } from '@/components/system';
import { usePathname } from '@/i18n/navigation';
import type { StepId } from '@/lib/draft/schema';
import { useDraftHydration } from '@/stores/use-draft-hydration';
import { useDraftTabSync } from '@/stores/use-draft-tab-sync';
import { StepGuard } from '../StepGuard/StepGuard';
import { StepNav } from '../StepNav/StepNav';
import { StepTape } from '../StepTape/StepTape';
import { StepValidationProvider } from '../StepValidation/StepValidation';
import { stepFromPath } from '../step-path';
import { useStepContext } from '../use-step-context';

export type ConfiguratorShellProps = {
  children: ReactNode;
};

function ConfiguratorFrame({
  step,
  children,
}: {
  step: StepId;
  children: ReactNode;
}) {
  const hydrated = useDraftHydration();
  const state = useStepContext();
  const ready = hydrated && state.status !== 'loading';
  const context = state.status === 'ready' ? state.context : null;

  useDraftTabSync();

  return (
    <StepValidationProvider>
      <StepLayout
        steps={<StepTape current={step} context={ready ? context : null} />}
        content={
          ready ? (
            <StepGuard step={step} context={context}>
              {children}
            </StepGuard>
          ) : (
            <ZoneSkeleton kind="rooms" />
          )
        }
        scene={null}
        showcase={ready ? null : <ZoneSkeleton kind="showcase" />}
        cost={
          ready ? <StepNav step={step} /> : <ZoneSkeleton kind="estimate" />
        }
      />
    </StepValidationProvider>
  );
}

export function ConfiguratorShell({ children }: ConfiguratorShellProps) {
  const step = stepFromPath(usePathname());

  if (step === null) {
    return children;
  }

  return <ConfiguratorFrame step={step}>{children}</ConfiguratorFrame>;
}
