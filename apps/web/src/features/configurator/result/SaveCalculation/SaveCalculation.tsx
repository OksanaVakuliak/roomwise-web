'use client';

import { useLocale, useTranslations } from 'next-intl';
import { ErrorState } from '@/components/system';
import { Banner, Button } from '@/components/ui';
import type { SavedCalculation } from '@/lib/api/calculations';
import { money } from '@/lib/format';
import { selectWarmupStatus, useWarmup } from '@/lib/warmup';
import { useDisplayCurrency } from '@/stores/use-display-currency';
import { SavedLink } from '../SavedLink/SavedLink';
import { WriteFailureNotice } from '../WriteFailureNotice/WriteFailureNotice';
import styles from './SaveCalculation.module.css';
import { type SaveState, useSaveCalculation } from './use-save-calculation';

export type SaveCalculationProps = {
  onSaved: (
    totals: SavedCalculation['version']['totals'],
    revision: number,
  ) => void;
};

function Feedback({
  state,
  onRetry,
}: {
  state: SaveState;
  onRetry: () => void;
}) {
  const t = useTranslations('SaveCalculation');
  const locale = useLocale();
  const { currency, rate } = useDisplayCurrency();

  switch (state.kind) {
    case 'limited':
      return (
        <Banner variant="warning">
          {t('rateLimited', { seconds: state.seconds })}
        </Banner>
      );
    case 'failed':
      return state.reason === 'validation' ? (
        <ErrorState headingLevel={3} onRetry={onRetry} />
      ) : (
        <WriteFailureNotice
          namespace="SaveCalculation.failure"
          reason={state.reason}
        />
      );
    case 'saved':
      return (
        <>
          <SavedLink
            publicId={state.publicId}
            versionNumber={state.versionNumber}
          />
          {state.diffCents === null ? null : (
            <Banner variant="info">
              {t(state.diffCents > 0 ? 'totalIncreased' : 'totalDecreased', {
                diff: money(Math.abs(state.diffCents), currency, locale, rate),
              })}
            </Banner>
          )}
        </>
      );
    default:
      return null;
  }
}

export function SaveCalculation({ onSaved }: SaveCalculationProps) {
  const t = useTranslations('SaveCalculation');
  const { state, save } = useSaveCalculation(onSaved);
  const warmingUp = useWarmup(selectWarmupStatus) !== 'ready';
  const pending = state.kind === 'pending';

  return (
    <section className={styles.root} aria-label={t('title')}>
      {state.kind === 'saved' ? null : (
        <Button
          onClick={save}
          loading={pending}
          loadingLabel={t(warmingUp ? 'warming' : 'saving')}
          disabled={state.kind === 'limited'}
        >
          {t('save')}
        </Button>
      )}
      <div className={styles.notices}>
        <Feedback state={state} onRetry={save} />
      </div>
    </section>
  );
}
