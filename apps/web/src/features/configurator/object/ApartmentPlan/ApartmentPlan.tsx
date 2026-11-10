'use client';

import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { useCallback, useId, useMemo } from 'react';
import { EmptyState, RoomPlan, SectionHeader } from '@/components/ui';
import { useLang } from '@/lib/api/catalog';
import { runEstimate } from '@/lib/engine/run-estimate';
import { focusField } from '@/lib/focus';
import { displayMoney } from '@/lib/format';
import { useDraft, useDraftValue } from '@/stores/draft';
import { usePricingData } from '@/stores/pricing-data';
import { useDisplayCurrency } from '@/stores/use-display-currency';
import { roomFieldDomId } from '../RoomEditor/room-field';
import styles from './ApartmentPlan.module.css';

export type ApartmentPlanRoom = {
  clientId: string;
  name: string;
  lengthM: number;
  widthM: number;
};

export type ApartmentPlanProps = {
  rooms: readonly ApartmentPlanRoom[];
  size: 'mobile' | 'desktop';
};

type PlanItemProps = {
  room: ApartmentPlanRoom;
  size: 'mobile' | 'desktop';
};

function PlanItem({ room, size }: PlanItemProps) {
  const t = useTranslations('ObjectStep');
  const format = useFormatter();
  const { clientId, name, lengthM, widthM } = room;
  const focusRoom = useCallback(
    () => focusField(roomFieldDomId(clientId, 'lengthM')),
    [clientId],
  );

  return (
    <RoomPlan
      name={name}
      details={`${format.number(lengthM)} × ${format.number(widthM)} ${t('rooms.unitM')}`}
      lengthCm={Math.round(lengthM * 100)}
      widthCm={Math.round(widthM * 100)}
      size={size}
      onClick={focusRoom}
    />
  );
}

function useCostLines() {
  const t = useTranslations('ObjectStep.planCost');
  const locale = useLocale();
  const lang = useLang();
  const draft = useDraftValue();
  const revision = useDraft((state) => state.revision);
  const pricing = usePricingData((state) => state.data);
  const version = usePricingData((state) => state.version);
  const { currency } = useDisplayCurrency();

  return useMemo(() => {
    if (pricing === null || version === null) {
      return [];
    }
    const { estimate, blockedLineIds } = runEstimate({
      draft,
      draftRevision: revision,
      pricing,
      pricingVersion: version,
      currency: 'UAH',
    });
    if (estimate === null) {
      return [];
    }

    const lines: string[] = [];
    for (const line of estimate.lines) {
      if (
        (line.section !== 'BASE' && line.section !== 'OBJECT') ||
        line.status !== 'OK' ||
        line.amountCents <= 0 ||
        blockedLineIds.has(line.id)
      ) {
        continue;
      }
      const rule = pricing.rules.find((item) => item.id === line.ruleId);
      if (!rule) {
        continue;
      }
      lines.push(
        t('objectLine', {
          name: rule.name[lang],
          amount: displayMoney(
            line.amountCents,
            line.amountUahKopecks,
            currency,
            locale,
          ),
        }),
      );
    }
    return lines;
  }, [pricing, version, draft, revision, currency, locale, lang, t]);
}

export function ApartmentPlan({ rooms, size }: ApartmentPlanProps) {
  const t = useTranslations('ObjectStep');
  const format = useFormatter();
  const headingId = useId();
  const totalAreaSqm = useDraft((state) => state.object.totalAreaSqm);
  const scope = useDraft((state) => state.object.scope);
  const costLines = useCostLines();

  const roomsArea = rooms.reduce(
    (sum, room) => sum + room.lengthM * room.widthM,
    0,
  );
  const areaText =
    scope === 'PARTIAL'
      ? t('planSummary.roomsArea', { rooms: format.number(roomsArea) })
      : totalAreaSqm === null
        ? t('planSummary.roomsOnly', { rooms: format.number(roomsArea) })
        : t('planSummary.roomsOfTotal', {
            rooms: format.number(roomsArea),
            total: format.number(totalAreaSqm),
          });

  return (
    <section className={styles.root} aria-labelledby={headingId}>
      <SectionHeader
        id={headingId}
        size={size}
        title={t('plan')}
        note={rooms.length > 0 ? t('planCount', { count: rooms.length }) : null}
      />
      {rooms.length === 0 ? (
        <EmptyState headingLevel={3} title={t('planEmpty')} />
      ) : (
        <>
          <ul className={styles.plans} aria-label={t('plan')}>
            {rooms.map((room) => (
              <li key={room.clientId} className={styles.plan}>
                <PlanItem room={room} size={size} />
              </li>
            ))}
          </ul>
          <p className={styles.summary}>{areaText}</p>
          {costLines.length > 0 ? (
            <ul className={styles.cost}>
              {costLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : null}
        </>
      )}
    </section>
  );
}
