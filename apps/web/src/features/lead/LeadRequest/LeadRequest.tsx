'use client';

import { useTranslations } from 'next-intl';
import { useId } from 'react';
import { SectionHeader } from '@/components/ui';
import { useLeadFormSettings } from '@/lib/api/leads';
import { LeadConfirmation } from '../LeadConfirmation/LeadConfirmation';
import { LeadForm } from '../LeadForm/LeadForm';
import { LeadNotice } from '../LeadNotice/LeadNotice';
import { type LeadTarget, useSubmitLead } from '../use-submit-lead';
import styles from './LeadRequest.module.css';

export type LeadRequestProps = { target: LeadTarget };

export function LeadRequest({ target }: LeadRequestProps) {
  const t = useTranslations('Lead');
  const titleId = useId();
  const settings = useLeadFormSettings();
  const { state, submit } = useSubmitLead(target);

  return (
    <section className={styles.root} aria-labelledby={titleId}>
      <SectionHeader id={titleId} title={t('title')} />
      {state.kind === 'sent' ? (
        <LeadConfirmation created={state.created} />
      ) : (
        <>
          <p className={styles.intro}>{t('intro')}</p>
          <LeadNotice settings={settings} />
          {settings.data ? <LeadForm state={state} onSubmit={submit} /> : null}
        </>
      )}
    </section>
  );
}
