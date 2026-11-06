'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Banner, Link } from '@/components/ui';
import { calculationPath } from '@/config/routes';
import type { LeadCreated } from '@/lib/api/leads';
import { money } from '@/lib/format';
import { useDisplayCurrency } from '@/stores/use-display-currency';
import styles from './LeadConfirmation.module.css';

export type LeadConfirmationProps = { created: LeadCreated };

export function LeadConfirmation({ created }: LeadConfirmationProps) {
  const t = useTranslations('Lead.confirmation');
  const locale = useLocale();
  const { currency, rate } = useDisplayCurrency();
  const { leadNumber, calculation, expiredAtSubmission, priceDifference } =
    created;
  const diffCents = priceDifference?.diffCents ?? 0;

  return (
    <div className={styles.root}>
      <Banner
        variant="success"
        title={t('title', { number: leadNumber })}
        action={
          <Link
            href={calculationPath(
              calculation.publicId,
              calculation.versionNumber,
            )}
          >
            {t('open')}
          </Link>
        }
      >
        {t('text')}
      </Banner>
      {expiredAtSubmission ? (
        <Banner variant="warning">{t('expired')}</Banner>
      ) : null}
      {diffCents === 0 ? null : (
        <Banner variant="info">
          {t(diffCents > 0 ? 'totalIncreased' : 'totalDecreased', {
            diff: money(Math.abs(diffCents), currency, locale, rate),
          })}
        </Banner>
      )}
    </div>
  );
}
