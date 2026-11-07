'use client';

import type { EstimateLine, PricingData } from '@roomwise/calc-engine';
import { type Locale, useLocale } from 'next-intl';
import { useMemo } from 'react';
import { type CardCostContext, cardCostContext } from '@/lib/engine/card-cost';
import { runEstimate } from '@/lib/engine/run-estimate';
import { displayMoney, type ExchangeRate, unitPrice } from '@/lib/format';
import { useDraft, useDraftValue } from '@/stores/draft';
import { usePricingData } from '@/stores/pricing-data';
import { useDisplayCurrency } from '@/stores/use-display-currency';

export type RoomPricing = {
  pricing: PricingData;
  productsById: ReadonlyMap<string, PricingData['products'][number]>;
  context: CardCostContext;
  partial: boolean;
  rate: ExchangeRate | undefined;
  materialsLine: (
    roomClientId: string,
    categoryId: string,
  ) => EstimateLine | null;
  line: (lineId: string) => EstimateLine | null;
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

  const productsById = useMemo(
    () => new Map((pricing?.products ?? []).map((item) => [item.id, item])),
    [pricing],
  );

  return useMemo(() => {
    if (pricing === null || version === null || lines === null) {
      return null;
    }
    return {
      pricing,
      context: cardCostContext(draft, pricing, version, 'UAH'),
      partial: draft.object.scope === 'PARTIAL',
      productsById,
      rate,
      materialsLine: (roomClientId, categoryId) =>
        lines.get(`MATERIALS:${roomClientId}:${categoryId}`) ?? null,
      line: (lineId) => lines.get(lineId) ?? null,
      formatLine: (line) =>
        displayMoney(line.amountCents, line.amountUahKopecks, currency, locale),
      formatTotal: (total) => {
        const cents = total.reduce((sum, line) => sum + line.amountCents, 0);
        const kopecks = total.reduce<number | null>(
          (sum, line) =>
            sum === null || line.amountUahKopecks === null
              ? null
              : sum + line.amountUahKopecks,
          0,
        );
        return displayMoney(cents, kopecks, currency, locale);
      },
      formatUnitPrice: (cents) => unitPrice(cents, currency, locale, rate),
    };
  }, [pricing, version, lines, draft, productsById, currency, rate, locale]);
}
