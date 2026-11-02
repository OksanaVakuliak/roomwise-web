'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useId, useMemo } from 'react';
import { SectionHeader, Stepper, SwitchRow } from '@/components/ui';
import { useEngineering } from '@/lib/api/catalog';
import { useDraft } from '@/stores/draft';
import type { RoomPricing } from '../../shell/use-room-pricing';
import { type ApartmentOption, apartmentOptions } from '../apartment-options';
import {
  isQuantityValid,
  optionQuantityId,
  quantityBounds,
} from '../option-quantity';
import styles from './OptionList.module.css';

type OptionKind = 'ENGINEERING' | 'ADDITIONAL';

export type OptionListProps = {
  kind: OptionKind;
  title: string;
  pricing: RoomPricing;
};

type OptionItemProps = {
  kind: OptionKind;
  pricing: RoomPricing;
  option: ApartmentOption;
};

function OptionItem({ kind, pricing, option }: OptionItemProps) {
  const t = useTranslations('OptionList');
  const chosen = useDraft((state) => state.options[option.id]);
  const toggleOption = useDraft((state) => state.toggleOption);
  const setOptionQuantity = useDraft((state) => state.setOptionQuantity);
  const piece = option.unit === 'PIECE';
  const bounds = quantityBounds(option);
  const on = chosen !== undefined;

  const handleToggle = useCallback(
    (next: boolean) =>
      piece
        ? toggleOption(option.id, next, bounds.min)
        : toggleOption(option.id, next),
    [bounds.min, option.id, piece, toggleOption],
  );
  const handleQuantity = useCallback(
    (value: number) => setOptionQuantity(option.id, Math.round(value)),
    [option.id, setOptionQuantity],
  );

  const quantity = chosen?.quantity ?? bounds.min;
  const valid = isQuantityValid(quantity, bounds);
  const line = on && valid ? pricing.line(`${kind}:option:${option.id}`) : null;
  const cost =
    option.available === false
      ? t('unavailable')
      : line && line.status === 'OK'
        ? pricing.formatLine(line)
        : t(`price.${piece ? 'PIECE' : 'PROJECT'}`, {
            price: pricing.formatUnitPrice(option.priceCents),
          });
  const error = valid
    ? undefined
    : bounds.max === undefined
      ? t('quantityMin', { min: bounds.min })
      : t('quantityRange', { min: bounds.min, max: bounds.max });

  return (
    <li className={styles.item}>
      <SwitchRow
        title={option.name}
        description={t('priced', { description: option.description, cost })}
        checked={on}
        onCheckedChange={handleToggle}
      />
      {on && piece ? (
        <Stepper
          id={optionQuantityId(option.id)}
          label={t('quantity', { name: option.name })}
          decrementLabel={t('decrement', { name: option.name })}
          incrementLabel={t('increment', { name: option.name })}
          value={quantity}
          min={bounds.min}
          max={bounds.max}
          onValueChange={handleQuantity}
          error={error}
        />
      ) : null}
    </li>
  );
}

export function OptionList({ kind, title, pricing }: OptionListProps) {
  const headingId = useId();
  const texts = useEngineering().data?.options;
  const chosen = useDraft((state) => state.options);
  const pricingOptions = pricing.pricing.options;
  const options = useMemo(
    () => apartmentOptions(texts, pricingOptions, kind, chosen),
    [texts, pricingOptions, kind, chosen],
  );

  if (options.length === 0) {
    return null;
  }

  return (
    <section className={styles.root} aria-labelledby={headingId}>
      <SectionHeader id={headingId} level={2} size="mobile" title={title} />
      <ul className={styles.list}>
        {options.map((option) => (
          <OptionItem
            key={option.id}
            kind={kind}
            pricing={pricing}
            option={option}
          />
        ))}
      </ul>
    </section>
  );
}
