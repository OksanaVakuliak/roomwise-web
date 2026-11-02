'use client';

import { type Locale, useLocale, useTranslations } from 'next-intl';
import { type ReactNode, useCallback, useId } from 'react';
import { ExchangeRateNote } from '@/components/layout';
import { ErrorState } from '@/components/system';
import {
  CostBar,
  KeyValueGrid,
  Link,
  Skeleton,
  VisuallyHidden,
} from '@/components/ui';
import { STEP_PATHS } from '@/config/routes';
import {
  buildEstimateModel,
  type EstimateActionTarget,
  EstimateBreakdown,
  type EstimateRoomInput,
  SectionBlock,
} from '@/features/estimate';
import { hasHeatedFloorWarning } from '@/lib/engine/heated-floor';
import { runEstimate } from '@/lib/engine/run-estimate';
import type { Money } from '@/lib/engine/sections';
import { area, moneyMinor } from '@/lib/format';
import { useDraft, useDraftValue } from '@/stores/draft';
import { usePreferences } from '@/stores/preferences';
import { checkPricingData, usePricingData } from '@/stores/pricing-data';
import { useDisplayCurrency } from '@/stores/use-display-currency';
import { OptionList } from '../../engineering/OptionList/OptionList';
import { useRoomPricing } from '../../shell/use-room-pricing';
import { optionRoomIds } from '../option-room-ids';
import { useEstimateCatalog } from '../use-estimate-catalog';
import styles from './ResultStep.module.css';

const EMPTY_VALUE = '—';
const NO_ROOMS: readonly EstimateRoomInput[] = [];

type ChangeLinkProps = { href: string; label: ReactNode };

function ChangeLink({ href, label }: ChangeLinkProps) {
  const t = useTranslations('ResultStep');

  return (
    <Link href={href}>
      {t('change')} <VisuallyHidden>{label}</VisuallyHidden>
    </Link>
  );
}

function ResultLoading() {
  const t = useTranslations('ResultStep');

  return (
    <div role="status" aria-label={t('loading')}>
      <Skeleton variant="block" />
    </div>
  );
}

function useChangeAction(rooms: readonly EstimateRoomInput[]) {
  const t = useTranslations('ResultStep');
  const tBreakdown = useTranslations('EstimateBreakdown.sections');

  return useCallback(
    (target: EstimateActionTarget) => {
      switch (target.section) {
        case 'base':
          return (
            <ChangeLink href={STEP_PATHS.object} label={tBreakdown('base')} />
          );
        case 'materials':
          return (
            <ChangeLink
              href={`${STEP_PATHS.interior}?room=${target.roomClientId}`}
              label={
                rooms.find((room) => room.clientId === target.roomClientId)
                  ?.name ?? t('roomFallback')
              }
            />
          );
        case 'engineering':
          return (
            <ChangeLink
              href={STEP_PATHS.engineering}
              label={tBreakdown('engineering')}
            />
          );
        case 'additional':
          return (
            <ChangeLink
              href={STEP_PATHS.engineering}
              label={tBreakdown('additional')}
            />
          );
      }
    },
    [rooms, t, tBreakdown],
  );
}

export function ResultStep() {
  const t = useTranslations('ResultStep');
  const tConfigurator = useTranslations('Configurator');
  const tForm = useTranslations('ObjectStep.form');
  const tWarning = useTranslations('Estimate.warning');
  const tRate = useTranslations('ExchangeRate');
  const locale: Locale = useLocale();
  const totalId = useId();
  const draft = useDraftValue();
  const revision = useDraft((state) => state.revision);
  const pricing = usePricingData((state) => state.data);
  const version = usePricingData((state) => state.version);
  const pricingStatus = usePricingData((state) => state.status);
  const preferred = usePreferences((state) => state.currency);
  const { currency, rate } = useDisplayCurrency();
  const catalogState = useEstimateCatalog();
  const roomPricing = useRoomPricing();
  const changeAction = useChangeAction(
    catalogState.status === 'ready' ? catalogState.rooms : NO_ROOMS,
  );

  if (pricing === null || version === null) {
    if (pricingStatus === 'error') {
      return <ErrorState headingLevel={2} onRetry={checkPricingData} />;
    }
    return <ResultLoading />;
  }

  if (catalogState.status === 'error') {
    return <ErrorState headingLevel={2} onRetry={catalogState.retry} />;
  }

  if (catalogState.status === 'loading') {
    return <ResultLoading />;
  }

  const { configuration, estimate, panel, blockedLineIds } = runEstimate({
    draft,
    draftRevision: revision,
    pricing,
    pricingVersion: version,
    currency: 'UAH',
  });

  if (configuration === null || estimate === null) {
    return <ResultLoading />;
  }

  const { catalog, rooms, styleName } = catalogState;
  const model = buildEstimateModel({
    estimate,
    rooms,
    catalog,
    blockedLineIds,
    optionRoomIds: optionRoomIds(configuration, pricing),
  });

  const inUah = currency === 'UAH';
  const rateMissing = preferred === 'UAH' && !inUah;
  const format = (value: Money | null): string => {
    if (value === null) {
      return EMPTY_VALUE;
    }
    if (inUah && value.uahKopecks !== null) {
      return moneyMinor(value.uahKopecks, 'UAH', locale);
    }
    return moneyMinor(value.usdCents, 'USD', locale);
  };

  const bars = [
    { key: 'base', label: tConfigurator('base'), money: panel.base },
    {
      key: 'materials',
      label: tConfigurator('materials'),
      money: panel.materials,
    },
    {
      key: 'engineering',
      label: tConfigurator('engineering'),
      money: panel.engineering,
    },
    {
      key: 'options',
      label: tConfigurator('options'),
      money: panel.additional,
    },
  ] as const;
  const sum = bars.reduce((acc, bar) => acc + (bar.money?.usdCents ?? 0), 0);
  const share = (value: Money | null) =>
    sum > 0 && value ? (value.usdCents / sum) * 100 : 0;

  const { object } = draft;
  const finishLabel =
    object.finishLevel === null
      ? EMPTY_VALUE
      : tForm(object.finishLevel === 'ROUGH' ? 'finishRough' : 'finishPre');
  const objectItems = [
    { key: 'finish', label: tForm('finishLevel'), value: finishLabel },
    {
      key: 'area',
      label: tForm('totalArea'),
      value:
        object.totalAreaSqm === null
          ? EMPTY_VALUE
          : area(object.totalAreaSqm, locale),
    },
    ...(object.balcony.present && object.balcony.areaSqm !== null
      ? [
          {
            key: 'balcony',
            label: tForm('balcony'),
            value: area(object.balcony.areaSqm, locale),
          },
        ]
      : []),
    { key: 'rooms', label: t('object.rooms'), value: draft.rooms.length },
    { key: 'style', label: t('object.style'), value: styleName ?? EMPTY_VALUE },
  ];

  return (
    <div className={styles.root}>
      <p className={styles.preliminary}>{t('preliminary')}</p>
      <section className={styles.total} aria-labelledby={totalId}>
        <div className={styles.bar}>
          <h2 id={totalId} className={styles.totalValue}>
            <VisuallyHidden>{t('totalLabel')}: </VisuallyHidden>
            {format(panel.total)}
          </h2>
          {inUah || rateMissing ? (
            <p className={styles.rate}>
              {inUah ? <ExchangeRateNote /> : tRate('unavailable')}
            </p>
          ) : null}
        </div>
        <div className={styles.bars}>
          {bars.map((bar) => (
            <CostBar
              key={bar.key}
              label={bar.label}
              share={share(bar.money)}
              value={format(bar.money)}
            />
          ))}
        </div>
        {hasHeatedFloorWarning(estimate) ? (
          <p className={styles.warning}>
            {tWarning('HEATED_FLOOR_INCOMPATIBLE')}
          </p>
        ) : null}
      </section>
      <EstimateBreakdown
        model={model}
        currency={currency}
        locale={locale}
        rate={rate}
        renderAction={changeAction}
      />
      {roomPricing ? (
        <OptionList
          kind="ADDITIONAL"
          title={t('additionalTitle')}
          pricing={roomPricing}
        />
      ) : null}
      <SectionBlock
        id={`${totalId}-object`}
        level={2}
        title={t('object.title')}
        action={
          <span className={styles.actions}>
            <Link href={STEP_PATHS.object}>{t('changeObject')}</Link>
            <Link href={STEP_PATHS.style}>{t('changeStyle')}</Link>
          </span>
        }
      >
        <KeyValueGrid items={objectItems} />
      </SectionBlock>
    </div>
  );
}
