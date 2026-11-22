'use client';

import { useEffect } from 'react';
import { STEP_PATHS } from '@/config/routes';
import { useRouter } from '@/i18n/navigation';
import { useDraft } from '@/stores/draft';
import { useDraftHydration } from '@/stores/use-draft-hydration';

export function StepRedirect() {
  const router = useRouter();
  const hydrated = useDraftHydration();
  const step = useDraft((state) => state.step);

  useEffect(() => {
    if (hydrated) {
      router.replace(STEP_PATHS[step]);
    }
  }, [hydrated, step, router]);

  return null;
}
