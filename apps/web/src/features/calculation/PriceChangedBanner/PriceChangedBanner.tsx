'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { Banner, Button } from '@/components/ui';
import { calculationPath } from '@/config/routes';
import { useRouter } from '@/i18n/navigation';
import type { VersionView } from '@/lib/api/calculations';
import { rateLimitValues } from '@/lib/api/use-rate-limit-countdown';
import { money } from '@/lib/format';
import { usePreferences } from '@/stores/preferences';
import { snapshotCurrency } from '../snapshot-currency';
import styles from './PriceChangedBanner.module.css';
import { useRecalculate } from './use-recalculate';

export type PriceChangedBannerProps = {
  version: VersionView;
};

export function PriceChangedBanner({ version }: PriceChangedBannerProps) {
  const t = useTranslations('CalculationPage.recalculate');
  const locale = useLocale();
  const router = useRouter();
  const preferred = usePreferences((state) => state.currency);
  const { currency, rate } = snapshotCurrency(preferred, version.exchangeRate);
  const diffCents = version.priceStatus?.diffCents ?? 0;
  const changed = version.priceStatus?.changed ?? false;

  const open = useCallback(
    (created: VersionView) =>
      router.push(calculationPath(created.publicId, created.number)),
    [router],
  );
  const { state, recalculate } = useRecalculate(version, open);
  const pending = state.kind === 'pending';

  if (!changed && !version.expired) {
    return null;
  }

  let text = t('changed');
  if (version.expired) {
    text = t('expired');
  } else if (diffCents !== 0) {
    text = t(diffCents > 0 ? 'increased' : 'decreased', {
      diff: money(Math.abs(diffCents), currency, locale, rate),
    });
  }

  return (
    <Banner
      variant="warning"
      action={
        <Button
          kind="fill"
          onClick={recalculate}
          loading={pending}
          loadingLabel={t('pending')}
          disabled={state.kind === 'limited'}
        >
          {t('action')}
        </Button>
      }
    >
      <div className={styles.root}>
        <p>{text}</p>
        {state.kind === 'failed' ? (
          <p role="alert" className={styles.error}>
            {t('failed')}
          </p>
        ) : null}
        {state.kind === 'limited' ? (
          <p role="alert" className={styles.error}>
            {t('rateLimited', rateLimitValues(state.seconds))}
          </p>
        ) : null}
      </div>
    </Banner>
  );
}
