'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useId } from 'react';
import { SectionHeader, Stepper, SwitchRow } from '@/components/ui';
import { useEngineering } from '@/lib/api/catalog';
import { useDraft } from '@/stores/draft';
import type { RoomPricing } from '../../shell/use-room-pricing';
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
  option: {
    id: string;
    name: string;
    description: string;
    priceCents: number;
    unit: string;
    minQuantity: number | null;
    maxQuantity: number | null;
  };
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
    (value: number) => setOptionQuantity(option.id, value),
    [option.id, setOptionQuantity],
  );

  const line = on ? pricing.line(`${kind}:option:${option.id}`) : null;
  const cost =
    line && line.status === 'OK'
      ? pricing.formatLine(line)
      : t(`price.${piece ? 'PIECE' : 'PROJECT'}`, {
          price: pricing.formatUnitPrice(option.priceCents),
        });
  const quantity = chosen?.quantity ?? bounds.min;
  const error = isQuantityValid(quantity, bounds)
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
  const priced = new Map(pricing.pricing.options.map((o) => [o.id, o]));

  const options = (texts ?? []).flatMap((text) => {
    const price = priced.get(text.id);
    if (
      !price ||
      text.kind !== kind ||
      text.perRoom ||
      text.code === 'HEATED_FLOOR' ||
      price.available === false
    ) {
      return [];
    }
    return [
      {
        id: text.id,
        name: text.name,
        description: text.description,
        priceCents: price.priceCents,
        unit: price.unit,
        minQuantity: price.minQuantity,
        maxQuantity: price.maxQuantity,
      },
    ];
  });

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
