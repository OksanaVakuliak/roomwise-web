'use client';

import type { EstimateLine, PricingData } from '@roomwise/calc-engine';
import { type Locale, useLocale } from 'next-intl';
import { useMemo } from 'react';
import type { CardCostContext } from '@/lib/engine/card-cost';
import { runEstimate } from '@/lib/engine/run-estimate';
import { type ExchangeRate, moneyMinor, unitPrice } from '@/lib/format';
import { useDraft, useDraftValue } from '@/stores/draft';
import { usePricingData } from '@/stores/pricing-data';
import { useDisplayCurrency } from '@/stores/use-display-currency';

export type RoomPricing = {
  pricing: PricingData;
  context: CardCostContext;
  rate: ExchangeRate | undefined;
  materialsLine: (
    roomClientId: string,
    categoryId: string,
  ) => EstimateLine | null;
  formatLine: (line: EstimateLine) => string;
  formatTotal: (lines: readonly EstimateLine[]) => string;
  formatUnitPrice: (cents: number) => string;
};

export function useRoomPricing(): RoomPricing | null {
  const locale: Locale = useLocale();
  const draft = useDraftValue();
  const revision = useDraft((state) => state.revision);
  const pricing = usePricingData((state) => state.data);
  const version = usePricingData((state) => state.version);
  const { currency, rate } = useDisplayCurrency();

  const lines = useMemo(() => {
    if (pricing === null || version === null) {
      return null;
    }
    const { estimate } = runEstimate({
      draft,
      draftRevision: revision,
      pricing,
      pricingVersion: version,
      currency: 'UAH',
    });
    return new Map((estimate?.lines ?? []).map((line) => [line.id, line]));
  }, [draft, revision, pricing, version]);

  return useMemo(() => {
    if (pricing === null || version === null || lines === null) {
      return null;
    }
    return {
      pricing,
      context: {
        draft,
        pricing,
        pricingVersion: version,
        currency: 'UAH',
      },
      rate,
      materialsLine: (roomClientId, categoryId) =>
        lines.get(`MATERIALS:${roomClientId}:${categoryId}`) ?? null,
      formatLine: (line) =>
        currency === 'UAH' && line.amountUahKopecks !== null
          ? moneyMinor(line.amountUahKopecks, 'UAH', locale)
          : moneyMinor(line.amountCents, 'USD', locale),
      formatTotal: (total) => {
        const cents = total.reduce((sum, line) => sum + line.amountCents, 0);
        const kopecks = total.reduce<number | null>(
          (sum, line) =>
            sum === null || line.amountUahKopecks === null
              ? null
              : sum + line.amountUahKopecks,
          0,
        );
        return currency === 'UAH' && kopecks !== null
          ? moneyMinor(kopecks, 'UAH', locale)
          : moneyMinor(cents, 'USD', locale);
      },
      formatUnitPrice: (cents) => unitPrice(cents, currency, locale, rate),
    };
  }, [pricing, version, lines, draft, currency, rate, locale]);
}
