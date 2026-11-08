'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import { Banner, Button, ConfirmDialog } from '@/components/ui';
import { defaultMaterialsQuery, useRoomTypes } from '@/lib/api/catalog';
import { hasManualChanges } from '@/lib/draft/style';
import { useDraft } from '@/stores/draft';

export function FillFromStyle() {
  const t = useTranslations('Specification');
  const tStyle = useTranslations('StyleStep');
  const queryClient = useQueryClient();
  const { data: roomTypes } = useRoomTypes();
  const visible = useDraft(
    (state) => state.object.scope === 'PARTIAL' && state.styleId !== null,
  );
  const selectStyle = useDraft((state) => state.selectStyle);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const fill = useCallback(async () => {
    const { styleId } = useDraft.getState();
    if (styleId === null || !roomTypes) {
      return;
    }
    setFailed(false);
    setBusy(true);
    try {
      const defaults = await queryClient.fetchQuery(
        defaultMaterialsQuery(styleId),
      );
      selectStyle(defaults, roomTypes);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }, [queryClient, roomTypes, selectStyle]);

  const request = useCallback(() => {
    if (hasManualChanges(useDraft.getState())) {
      setConfirming(true);
      return;
    }
    void fill();
  }, [fill]);

  const confirm = useCallback(() => {
    setConfirming(false);
    void fill();
  }, [fill]);

  const cancel = useCallback(() => setConfirming(false), []);
  const dismiss = useCallback(() => setFailed(false), []);

  if (!visible) {
    return null;
  }

  return (
    <>
      {failed ? (
        <Banner variant="error" onDismiss={dismiss} dismissLabel={t('dismiss')}>
          {tStyle('loadFailed')}
        </Banner>
      ) : null}
      <Button kind="outline" disabled={busy || !roomTypes} onClick={request}>
        {t('fillFromStyle')}
      </Button>
      <ConfirmDialog
        open={confirming}
        title={tStyle('confirm.title')}
        description={tStyle('confirm.description')}
        confirmLabel={tStyle('confirm.confirm')}
        cancelLabel={tStyle('confirm.cancel')}
        closeLabel={tStyle('confirm.close')}
        onConfirm={confirm}
        onCancel={cancel}
      />
    </>
  );
}
