'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useShallow } from 'zustand/react/shallow';
import { ExchangeRateNote } from '@/components/layout';
import { ErrorState, ZoneSkeleton } from '@/components/system';
import { EstimateStamp } from '@/components/ui';
import { type DraftV1, DraftV1Schema } from '@/lib/draft/schema';
import { runEstimate } from '@/lib/engine/run-estimate';
import type { Money } from '@/lib/engine/sections';
import { moneyMinor } from '@/lib/format';
import { useDraft } from '@/stores/draft';
import { checkPricingData, usePricingData } from '@/stores/pricing-data';
import { useDisplayCurrency } from '@/stores/use-display-currency';

const DRAFT_KEYS = Object.keys(DraftV1Schema.shape) as (keyof DraftV1)[];
const EMPTY_VALUE = '—';

function pickDraft(state: DraftV1): DraftV1 {
  return Object.fromEntries(
    DRAFT_KEYS.map((key) => [key, state[key]]),
  ) as DraftV1;
}

export function CostPanel() {
  const t = useTranslations('CostPanel');
  const tConfigurator = useTranslations('Configurator');
  const locale = useLocale();
  const draft = useDraft(useShallow(pickDraft));
  const revision = useDraft((state) => state.revision);
  const pricing = usePricingData((state) => state.data);
  const version = usePricingData((state) => state.version);
  const status = usePricingData((state) => state.status);
  const { currency } = useDisplayCurrency();

  if (pricing === null || version === null) {
    if (status === 'error') {
      return (
        <ErrorState
          headingLevel={3}
          title={t('errorTitle')}
          message={t('errorMessage')}
          onRetry={checkPricingData}
        />
      );
    }
    return <ZoneSkeleton kind="estimate" />;
  }

  const { panel } = runEstimate({
    draft,
    draftRevision: revision,
    pricing,
    pricingVersion: version,
    currency: 'UAH',
  });

  const inUah = currency === 'UAH' && panel.total?.uahKopecks != null;
  const format = (value: Money | null): string => {
    if (value === null) {
      return EMPTY_VALUE;
    }
    if (inUah && value.uahKopecks !== null) {
      return moneyMinor(value.uahKopecks, 'UAH', locale);
    }
    return moneyMinor(value.usdCents, 'USD', locale);
  };

  const rows = [
    { key: 'base', label: t('base'), money: panel.base },
    { key: 'materials', label: t('materials'), money: panel.materials },
    { key: 'engineering', label: t('engineering'), money: panel.engineering },
    { key: 'additional', label: t('additional'), money: panel.additional },
  ] as const;
  const sum = rows.reduce((acc, row) => acc + (row.money?.usdCents ?? 0), 0);
  const share = (value: Money | null) =>
    sum > 0 && value ? (value.usdCents / sum) * 100 : 0;
  const total = format(panel.total);

  return (
    <EstimateStamp
      totalLabel={tConfigurator('totalLabel')}
      total={total}
      note={inUah ? <ExchangeRateNote /> : undefined}
      barLabel={tConfigurator('barLabel', {
        base: Math.round(share(panel.base)),
        materials: Math.round(share(panel.materials)),
        engineering: Math.round(share(panel.engineering)),
        options: Math.round(share(panel.additional)),
      })}
      toggleLabel={tConfigurator('toggleLabel')}
      announcement={tConfigurator('announcement', { total })}
      parts={rows.map((row) => ({
        key: row.key,
        label: row.label,
        value: format(row.money),
        share: share(row.money),
      }))}
    />
  );
}
