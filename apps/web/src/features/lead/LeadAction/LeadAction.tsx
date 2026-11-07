'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui';
import { LeadRequest } from '../LeadRequest/LeadRequest';
import type { LeadTarget } from '../use-submit-lead';
import styles from './LeadAction.module.css';

export type LeadActionProps = {
  target: LeadTarget;
  blocked?: boolean;
  blockedNoteId?: string;
};

export function LeadAction({
  target,
  blocked = false,
  blockedNoteId,
}: LeadActionProps) {
  const t = useTranslations('Lead');
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const show = useCallback(() => setOpen(true), []);

  useEffect(() => {
    if (open) {
      panel.current?.focus();
    }
  }, [open]);

  if (!open) {
    return (
      <Button
        kind="fill"
        onClick={show}
        disabled={blocked}
        aria-describedby={blocked ? blockedNoteId : undefined}
      >
        {t('open')}
      </Button>
    );
  }

  return (
    <div ref={panel} tabIndex={-1} className={styles.panel}>
      <LeadRequest target={target} />
    </div>
  );
}
