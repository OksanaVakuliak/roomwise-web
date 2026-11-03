'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import { Button, ConfirmDialog } from '@/components/ui';
import { STEP_PATHS } from '@/config/routes';
import { useRouter } from '@/i18n/navigation';
import type { VersionView } from '@/lib/api/calculations';
import { fromVersion } from '@/lib/draft/from-version';
import type { DraftV1 } from '@/lib/draft/schema';
import { findHeatedFloorOption } from '@/lib/engine/heated-floor';
import { pickDraft, useDraft } from '@/stores/draft';
import { checkPricingData, usePricingData } from '@/stores/pricing-data';
import { useDraftHydration } from '@/stores/use-draft-hydration';

export type EditInConfiguratorProps = {
  version: VersionView;
};

function isDraftEmpty({ object, rooms, styleId, options }: DraftV1): boolean {
  return (
    object.finishLevel === null &&
    object.totalAreaSqm === null &&
    !object.balcony.present &&
    rooms.length === 0 &&
    styleId === null &&
    Object.keys(options).length === 0
  );
}

export function EditInConfigurator({ version }: EditInConfiguratorProps) {
  const t = useTranslations('CalculationPage.edit');
  const router = useRouter();
  const hydrated = useDraftHydration();
  const replaceDraft = useDraft((state) => state.replaceDraft);
  const [confirming, setConfirming] = useState(false);

  const edit = useCallback(async () => {
    setConfirming(false);
    await checkPricingData();
    const { data } = usePricingData.getState();
    const heatedFloorOptionId = data
      ? (findHeatedFloorOption(data.options)?.id ?? null)
      : null;
    replaceDraft(fromVersion(version, heatedFloorOptionId));
    router.push(STEP_PATHS.result);
  }, [version, replaceDraft, router]);

  const start = useCallback(() => {
    if (isDraftEmpty(pickDraft(useDraft.getState()))) {
      void edit();
    } else {
      setConfirming(true);
    }
  }, [edit]);
  const cancel = useCallback(() => setConfirming(false), []);

  return (
    <>
      <Button onClick={start} disabled={!hydrated}>
        {t('action')}
      </Button>
      <ConfirmDialog
        open={confirming}
        title={t('title')}
        description={t('message')}
        confirmLabel={t('confirm')}
        cancelLabel={t('cancel')}
        closeLabel={t('close')}
        onConfirm={edit}
        onCancel={cancel}
      />
    </>
  );
}
