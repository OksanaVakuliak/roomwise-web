'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useRef, useState } from 'react';
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
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const busy = useRef(false);

  const edit = useCallback(async () => {
    if (busy.current) {
      return;
    }
    busy.current = true;
    setConfirming(false);
    setFailed(false);
    setPending(true);
    try {
      await checkPricingData();
      const { data } = usePricingData.getState();
      if (!data) {
        setFailed(true);
        return;
      }
      const heatedFloorOptionId =
        findHeatedFloorOption(data.options)?.id ?? null;
      replaceDraft(fromVersion(version, heatedFloorOptionId));
      router.push(STEP_PATHS.result);
    } finally {
      busy.current = false;
      setPending(false);
    }
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
      <Button
        onClick={start}
        disabled={!hydrated}
        loading={pending}
        loadingLabel={t('pending')}
      >
        {t('action')}
      </Button>
      {failed ? <p role="alert">{t('failed')}</p> : null}
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
