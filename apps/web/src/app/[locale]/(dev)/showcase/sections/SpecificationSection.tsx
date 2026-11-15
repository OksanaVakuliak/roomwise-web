'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import {
  Button,
  Gallery,
  PickedBadge,
  Price,
  SectionHeader,
  SpecItem,
  StyleCard,
} from '@/components/ui';
import { money } from '@/lib/format';
import { SizeFrame } from '../DesktopFrame';
import styles from './SpecificationSection.module.css';

const RATE = { uahPerUsd: 41.5 };
const ROOM_AREA = 6;
const SIZES = ['mobile', 'desktop'] as const;
const ITEMS = [
  { id: 'oak', cents: 1420, fit: 'no', tone: 'wood' },
  { id: 'ash', cents: 4100, fit: 'no', tone: 'paint' },
  { id: 'pine', cents: 1980, fit: 'ok', tone: 'concrete' },
  { id: 'graphite', cents: 2250, fit: 'ok', tone: 'line' },
  { id: 'walnut', cents: 1190, fit: 'no', tone: 'wood' },
] as const;
const SHOTS = ['front', 'side', 'close'] as const;
const STYLES = ['scandinavian', 'loft', 'classic'] as const;
const STYLE_TONES = ['paint', 'concrete', 'wood'] as const;

type Tone = 'wood' | 'paint' | 'concrete' | 'line';

function Swatch({ tone }: { tone: Tone }) {
  return (
    <svg viewBox="0 0 64 64" focusable="false" preserveAspectRatio="none">
      <rect width="64" height="64" className={styles[tone]} />
      <path d="M0 40 L64 24 M0 56 L64 40" className={styles.grain} />
    </svg>
  );
}

type Item = (typeof ITEMS)[number];

function SpecRow({ item, size }: { item: Item; size: (typeof SIZES)[number] }) {
  const t = useTranslations('ShowcaseSpecification');
  const locale = useLocale();
  const [selected, setSelected] = useState(
    item.id === 'oak' || item.id === 'graphite',
  );
  const toggle = useCallback(() => setSelected((current) => !current), []);

  return (
    <SpecItem
      size={size}
      image={<Swatch tone={item.tone} />}
      name={t(`items.${item.id}.name`)}
      brand={t(`items.${item.id}.brand`)}
      dimensions={t(`items.${item.id}.dimensions`)}
      color={item.id === 'walnut' ? t('items.walnut.color') : undefined}
      fit={item.fit}
      fitLabel={t(item.fit === 'ok' ? 'fitOk' : 'fitNo')}
      components={
        item.id === 'oak'
          ? [
              {
                id: 'material',
                label: t('componentMaterial'),
                amount: money(item.cents * ROOM_AREA, 'USD', locale),
              },
              {
                id: 'accessory',
                label: t('componentAccessory'),
                amount: money(200 * ROOM_AREA, 'USD', locale),
              },
              {
                id: 'labor',
                label: t('componentLabor'),
                amount: money(420 * ROOM_AREA, 'USD', locale),
              },
              {
                id: 'prep',
                label: t('componentPrep'),
                amount: money(230 * ROOM_AREA, 'USD', locale),
              },
            ]
          : undefined
      }
      warning={item.id === 'ash' ? t('warning') : undefined}
      unavailable={item.id === 'walnut'}
      unavailableLabel={t('unavailable')}
      selected={selected}
      pickedLabel={t('picked')}
      price={
        <Price
          cents={item.cents}
          currency={size === 'desktop' ? 'UAH' : 'USD'}
          locale={locale}
          rate={RATE}
        />
      }
      unit={t('perSquare')}
      roomCost={
        <Price
          cents={item.cents * ROOM_AREA}
          currency={size === 'desktop' ? 'UAH' : 'USD'}
          locale={locale}
          rate={RATE}
        />
      }
      roomCostLabel={t('forRoom')}
      showDetailsLabel={t('showDetails')}
      hideDetailsLabel={t('hideDetails')}
      actions={
        <Button
          kind={selected ? 'outline' : 'fill'}
          aria-pressed={selected}
          onClick={toggle}
        >
          {t(selected ? 'chosen' : 'choose')}
        </Button>
      }
    />
  );
}

function SpecList({ size }: { size: (typeof SIZES)[number] }) {
  return (
    <div className={`${styles.list} ${size === 'desktop' ? styles.wide : ''}`}>
      {ITEMS.map((item) => (
        <SpecRow key={item.id} item={item} size={size} />
      ))}
    </div>
  );
}

type StyleName = (typeof STYLES)[number];

function StyleOption({
  name,
  tone,
  selected,
  onPick,
}: {
  name: StyleName;
  tone: Tone;
  selected: boolean;
  onPick: (name: StyleName) => void;
}) {
  const t = useTranslations('ShowcaseSpecification');
  const pick = useCallback(() => onPick(name), [onPick, name]);

  return (
    <StyleCard
      image={<Swatch tone={tone} />}
      name={t(`styles.${name}.name`)}
      description={t(`styles.${name}.description`)}
      selected={selected}
      pickedLabel={t('picked')}
      onSelect={pick}
    />
  );
}

export function SpecificationSection() {
  const t = useTranslations('ShowcaseSpecification');
  const locale = useLocale();
  const [style, setStyle] = useState<StyleName>('scandinavian');
  const imageLabel = useCallback(
    (index: number, total: number) => t('imageOf', { index, total }),
    [t],
  );

  return (
    <div className={styles.stack}>
      <h3 className={styles.heading}>{t('sectionHeader')}</h3>
      {SIZES.map((size) => (
        <div key={size}>
          <p className={styles.caption}>{t(size)}</p>
          <SizeFrame
            size={size}
            label={t('sectionHeaderFrame', { size: t(size) })}
          >
            <div
              className={`${styles.headers} ${size === 'desktop' ? styles.wide : ''}`}
            >
              <SectionHeader
                level={4}
                size={size}
                title={t('headerTitleOn')}
                note={t('headerNote')}
              />
              <SectionHeader
                level={4}
                size={size}
                title={t('headerTitleOff')}
              />
              <SectionHeader
                level={4}
                size={size}
                title={t('headerTitleAmount')}
                amount={money(121460, 'USD', locale)}
              />
            </div>
          </SizeFrame>
        </div>
      ))}

      <h3 className={styles.heading}>{t('pickedBadge')}</h3>
      <p className={styles.row}>
        <PickedBadge>{t('picked')}</PickedBadge>
      </p>

      <h3 className={styles.heading}>{t('price')}</h3>
      <ul className={styles.row}>
        <li className={styles.cell}>
          <span className={styles.caption}>{t('priceUsd')}</span>
          <Price cents={1420} currency="USD" locale={locale} />
        </li>
        <li className={styles.cell}>
          <span className={styles.caption}>{t('priceUah')}</span>
          <Price cents={1420} currency="UAH" locale={locale} rate={RATE} />
        </li>
        <li className={styles.cell}>
          <span className={styles.caption}>{t('priceOldUsd')}</span>
          <Price
            cents={1420}
            oldCents={1800}
            currency="USD"
            locale={locale}
            oldLabel={t('oldPrice')}
            currentLabel={t('currentPrice')}
          />
        </li>
        <li className={styles.cell}>
          <span className={styles.caption}>{t('priceOldUah')}</span>
          <Price
            cents={1420}
            oldCents={1800}
            currency="UAH"
            locale={locale}
            rate={RATE}
            oldLabel={t('oldPrice')}
            currentLabel={t('currentPrice')}
          />
        </li>
      </ul>

      <h3 className={styles.heading}>{t('specItem')}</h3>
      <p className={styles.caption}>{t('specItemNote')}</p>
      {SIZES.map((size) => (
        <div key={size}>
          <p className={styles.caption}>{t(size)}</p>
          <SizeFrame size={size} label={t('specItemFrame', { size: t(size) })}>
            <div className={styles.frame}>
              <SpecList size={size} />
            </div>
          </SizeFrame>
        </div>
      ))}

      <h3 className={styles.heading}>{t('gallery')}</h3>
      <p className={styles.caption}>{t('galleryNote')}</p>
      <div className={styles.gallery}>
        <Gallery
          label={t('galleryLabel')}
          images={SHOTS.map((shot) => ({
            src: null,
            name: t(`shots.${shot}`),
          }))}
          thumbnailLabel={imageLabel}
        />
      </div>

      <h3 className={styles.heading}>{t('styleCard')}</h3>
      <ul className={styles.cards}>
        {STYLES.map((name, index) => (
          <li key={name}>
            <StyleOption
              name={name}
              tone={STYLE_TONES[index]}
              selected={style === name}
              onPick={setStyle}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
