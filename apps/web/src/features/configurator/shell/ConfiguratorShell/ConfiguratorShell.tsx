'use client';

import { type ReactNode, useState } from 'react';
import { StepLayout } from '@/components/layout';
import { ZoneSkeleton, type ZoneSkeletonKind } from '@/components/system';
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
import { useDefaultStyle } from '../use-default-style';
import { useDraftReconciliation } from '../use-draft-reconciliation';
import { useStepContext } from '../use-step-context';
import { useSurfaceNormalization } from '../use-surface-normalization';

const CONTENT_SKELETONS: Record<StepId, ZoneSkeletonKind> = {
  object: 'object',
  interior: 'interior',
  engineering: 'engineering',
  style: 'style',
  result: 'result',
};

const SHOWCASE_SKELETONS: Partial<Record<StepId, ZoneSkeletonKind>> = {
  object: 'plan',
  interior: 'showcase',
};

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

  const showcaseSkeleton = SHOWCASE_SKELETONS[step];

  useDraftTabSync();
  useSurfaceNormalization(hydrated);
  useDraftReconciliation(hydrated);
  useDefaultStyle(hydrated);

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
                  <ZoneSkeleton kind={CONTENT_SKELETONS[step]} />
                )
              }
              picker={
                step === 'interior' ? (
                  <>
                    <div ref={setPickerSlot} />
                    {ready ? null : <ZoneSkeleton kind="picker" />}
                  </>
                ) : undefined
              }
              scene={
                <>
                  <div ref={setSceneSlot} />
                  {ready || step !== 'interior' ? null : (
                    <ZoneSkeleton kind="scene" />
                  )}
                </>
              }
              showcase={
                showcaseSkeleton === undefined ? null : (
                  <>
                    <div ref={setShowcaseSlot} />
                    {ready ? null : <ZoneSkeleton kind={showcaseSkeleton} />}
                  </>
                )
              }
              cost={
                ready ? (
                  <>
                    {step === 'result' ? null : <CostPanel />}
                    <StepNav step={step} context={context} />
                  </>
                ) : (
                  <>
                    {step === 'result' ? null : (
                      <ZoneSkeleton kind="estimate" />
                    )}
                    <ZoneSkeleton kind="nav" />
                  </>
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
