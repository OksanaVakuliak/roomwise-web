'use client';

import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { toast } from '@/lib/toast';

export function useSaveToast(): (options?: { affectsCost?: boolean }) => void {
  const t = useTranslations('Admin.form');
  return useCallback(
    ({ affectsCost = false } = {}) => {
      toast.success(affectsCost ? t('savedCost') : t('saved'));
    },
    [t],
  );
}
