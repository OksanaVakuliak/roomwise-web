'use client';

import { useLocale, useTranslations } from 'next-intl';
import { type ReactNode, useCallback, useState } from 'react';
import {
  Button,
  CostBar,
  EstimateStamp,
  KeyValueGrid,
  ResultRow,
  StackBar,
} from '@/components/ui';
import { type Currency, type ExchangeRate, money } from '@/lib/format';
import { DesktopFrame } from '../DesktopFrame';
import styles from './EstimateSection.module.css';

const RATE: ExchangeRate = { uahPerUsd: 41.5 };
const CURRENCIES = ['USD', 'UAH'] as const;
const PARTS = [
  { key: 'base', cents: 684400 },
  { key: 'materials', cents: 491240 },
  { key: 'engineering', cents: 126000 },
  { key: 'options', cents: 34000 },
] as const;
const EXTRA_CENTS = 25000;

function Stamp({
  currency,
  extra,
  defaultExpanded,
}: {
  currency: Currency;
  extra: number;
  defaultExpanded?: boolean;
}) {
  const t = useTranslations('ShowcaseEstimate');
  const locale = useLocale();
  const format = (cents: number) => money(cents, currency, locale, RATE);
  const sum = PARTS.reduce((total, part) => total + part.cents, 0) + extra;
  const total = format(sum);

  return (
    <EstimateStamp
      totalLabel={t('totalLabel')}
      total={total}
      barLabel={t('stackBarLabel')}
      toggleLabel={t('toggleLabel')}
      announcement={t('announcement', { total })}
      defaultExpanded={defaultExpanded}
      parts={PARTS.map((part) => ({
        key: part.key,
        label: t(part.key),
        value: format(part.cents),
        share: (part.cents / sum) * 100,
      }))}
      actions={
        <>
          <Button>{t('back')}</Button>
          <Button kind="fill">{t('next')}</Button>
        </>
      }
    />
  );
}

function Variant({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className={styles.caption}>{title}</p>
      {children}
    </div>
  );
}

export function EstimateSection() {
  const t = useTranslations('ShowcaseEstimate');
  const locale = useLocale();
  const [extra, setExtra] = useState(0);
  const toggleExtra = useCallback(
    () => setExtra((value) => (value === 0 ? EXTRA_CENTS : 0)),
    [],
  );
  const sum = PARTS.reduce((total, part) => total + part.cents, 0);
  const shares = PARTS.map((part) => ({
    key: part.key,
    share: (part.cents / sum) * 100,
  }));
  const peak = Math.max(...PARTS.map((part) => part.cents));

  return (
    <div className={styles.stack}>
      <h3 className={styles.heading}>{t('stackBarTitle')}</h3>
      <div className={styles.narrow}>
        <StackBar segments={shares} label={t('stackBarLabel')} />
      </div>

      {CURRENCIES.map((currency) => (
        <div key={currency} className={styles.stack}>
          <h3 className={styles.heading}>{t('costBarTitle')}</h3>
          <p className={styles.caption}>
            {currency === 'USD' ? t('currencyUsd') : t('currencyUah')}
          </p>
          <div className={styles.narrow}>
            {PARTS.map((part) => (
              <CostBar
                key={part.key}
                label={t(part.key)}
                share={(part.cents / peak) * 100}
                value={money(part.cents, currency, locale, RATE)}
              />
            ))}
          </div>
        </div>
      ))}

      <h3 className={styles.heading}>{t('stampTitle')}</h3>
      <p className={styles.row}>
        <Button onClick={toggleExtra}>{t('changeTotal')}</Button>
      </p>
      <p className={styles.caption}>{t('changeNote')}</p>
      <Variant title={`${t('mobile')}, ${t('currencyUsd')}`}>
        <div className={styles.narrow}>
          <Stamp currency="USD" extra={extra} />
        </div>
      </Variant>
      <Variant title={t('stampExpanded')}>
        <div className={styles.narrow}>
          <Stamp currency="USD" extra={extra} defaultExpanded />
        </div>
      </Variant>
      <Variant title={t('stampUah')}>
        <div className={styles.narrow}>
          <Stamp currency="UAH" extra={extra} />
        </div>
      </Variant>
      <Variant title={t('stampDesktop')}>
        <DesktopFrame label={t('stampDesktop')}>
          <div className={styles.wide}>
            <Stamp currency="USD" extra={extra} />
          </div>
        </DesktopFrame>
      </Variant>
      <Variant title={t('stampUahDesktop')}>
        <DesktopFrame label={t('stampUahDesktop')}>
          <div className={styles.wide}>
            <Stamp currency="UAH" extra={extra} />
          </div>
        </DesktopFrame>
      </Variant>

      <h3 className={styles.heading}>{t('resultRowTitle')}</h3>
      {CURRENCIES.map((currency) => (
        <div key={currency} className={styles.narrow}>
          <ResultRow
            position="1.2"
            title={t('rowDefaultTitle')}
            note={t('rowDefaultNote')}
            value={money(31482, currency, locale, RATE)}
          />
          <ResultRow
            variant="new"
            position="1.6"
            title={t('rowNewTitle')}
            note={t('rowNewNote')}
            value={money(3180, currency, locale, RATE)}
          />
        </div>
      ))}

      <h3 className={styles.heading}>{t('keyValueTitle')}</h3>
      <div className={styles.narrow}>
        <KeyValueGrid
          items={[
            { key: 'type', label: t('type'), value: t('typeValue') },
            { key: 'area', label: t('area'), value: t('areaValue') },
            {
              key: 'condition',
              label: t('condition'),
              value: t('conditionValue'),
            },
            { key: 'ceiling', label: t('ceiling'), value: t('ceilingValue') },
          ]}
        />
      </div>
    </div>
  );
}
