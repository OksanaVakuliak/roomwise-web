'use client';

import { useTranslations } from 'next-intl';
import { ToastRegion } from '@/components/ui';
import { toast, useToasts } from '@/lib/toast';

export function AdminToasts() {
  const t = useTranslations('Admin.toasts');
  const items = useToasts((state) => state.items);
  return (
    <ToastRegion
      toasts={items}
      onDismiss={toast.dismiss}
      label={t('label')}
      dismissLabel={t('dismiss')}
    />
  );
}
