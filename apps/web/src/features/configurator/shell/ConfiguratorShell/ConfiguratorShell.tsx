'use client';

import { type ReactNode, useState } from 'react';
import { StepLayout } from '@/components/layout';
import { ZoneSkeleton } from '@/components/system';
import { usePathname } from '@/i18n/navigation';
import type { StepId } from '@/lib/draft/schema';
import { useDraftHydration } from '@/stores/use-draft-hydration';
import { useDraftTabSync } from '@/stores/use-draft-tab-sync';
import { CostPanel } from '../CostPanel/CostPanel';
import { DraftNotices } from '../DraftNotices/DraftNotices';
import { PickerSlotContext } from '../PickerSlot/picker-slot-context';
import { SceneSlotContext } from '../SceneSlot/scene-slot-context';
import { ShowcaseSlotContext } from '../ShowcaseSlot/showcase-slot-context';
import { StepGuard } from '../StepGuard/StepGuard';
import { StepNav } from '../StepNav/StepNav';
import { StepTape } from '../StepTape/StepTape';
import { StepValidationProvider } from '../StepValidation/StepValidation';
import { stepFromPath } from '../step-path';
import { useStepContext } from '../use-step-context';
import { useSurfaceNormalization } from '../use-surface-normalization';

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
  const [sceneSlot, setSceneSlot] = useState<HTMLElement | null>(null);
  const [showcaseSlot, setShowcaseSlot] = useState<HTMLElement | null>(null);
  const [pickerSlot, setPickerSlot] = useState<HTMLElement | null>(null);

  useDraftTabSync();
  useSurfaceNormalization(hydrated);

  return (
    <StepValidationProvider>
      <SceneSlotContext value={sceneSlot}>
        <ShowcaseSlotContext value={showcaseSlot}>
          <PickerSlotContext value={pickerSlot}>
            <StepLayout
              single={step === 'result'}
              steps={
                <StepTape current={step} context={ready ? context : null} />
              }
              content={
                ready ? (
                  <>
                    <DraftNotices />
                    <StepGuard step={step} context={context}>
                      {children}
                    </StepGuard>
                  </>
                ) : (
                  <ZoneSkeleton kind="rooms" />
                )
              }
              picker={
                step === 'interior' ? <div ref={setPickerSlot} /> : undefined
              }
              scene={<div ref={setSceneSlot} />}
              showcase={
                ready ? (
                  <div ref={setShowcaseSlot} />
                ) : (
                  <ZoneSkeleton kind="showcase" />
                )
              }
              cost={
                ready ? (
                  <>
                    {step === 'result' ? null : <CostPanel />}
                    <StepNav step={step} context={context} />
                  </>
                ) : (
                  <ZoneSkeleton kind="estimate" />
                )
              }
            />
          </PickerSlotContext>
        </ShowcaseSlotContext>
      </SceneSlotContext>
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
