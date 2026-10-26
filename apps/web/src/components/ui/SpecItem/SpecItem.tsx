import type { ReactNode } from 'react';
import { cx } from '@/lib/cx';
import { PickedBadge } from '../PickedBadge/PickedBadge';
import styles from './SpecItem.module.css';

export type SpecItemFit = 'ok' | 'no';

export type SpecItemProps = {
  position: string;
  size?: 'mobile' | 'desktop';
  image: ReactNode;
  name: ReactNode;
  brand?: ReactNode;
  dimensions?: ReactNode;
  color?: ReactNode;
  fit?: SpecItemFit;
  fitLabel?: ReactNode;
  warning?: ReactNode;
  unavailable?: boolean;
  unavailableLabel?: ReactNode;
  selected?: boolean;
  pickedLabel: ReactNode;
  price: ReactNode;
  unit?: ReactNode;
  roomCost?: ReactNode;
  roomCostLabel?: ReactNode;
  onSelect?: () => void;
};

export function SpecItem({
  position,
  size = 'mobile',
  image,
  name,
  brand,
  dimensions,
  color,
  fit,
  fitLabel,
  warning,
  unavailable = false,
  unavailableLabel,
  selected = false,
  pickedLabel,
  price,
  unit,
  roomCost,
  roomCostLabel,
  onSelect,
}: SpecItemProps) {
  const classes = cx(
    styles.root,
    styles[size],
    selected && styles.on,
    unavailable && styles.unavailable,
  );

  return (
    <button
      type="button"
      className={classes}
      aria-pressed={selected}
      disabled={unavailable}
      onClick={onSelect}
    >
      {selected ? <span className={styles.bar} aria-hidden="true" /> : null}
      <span className={styles.position}>{position}</span>
      <span className={styles.image} aria-hidden="true">
        {image}
      </span>
      <span className={styles.body}>
        <span className={styles.name}>{name}</span>
        {brand || dimensions || color ? (
          <span className={styles.details}>
            {brand ? <span className={styles.brand}>{brand}</span> : null}
            {dimensions || color ? (
              <span>
                {dimensions}
                {dimensions && color ? ', ' : null}
                {color}
              </span>
            ) : null}
          </span>
        ) : null}
        {fit && fitLabel ? (
          <span className={cx(styles.fit, styles[fit])}>{fitLabel}</span>
        ) : null}
        {warning ? <span className={styles.warning}>{warning}</span> : null}
        {unavailable && unavailableLabel ? (
          <span className={styles.unavailableNote}>{unavailableLabel}</span>
        ) : null}
        {selected ? (
          <span className={styles.picked}>
            <PickedBadge>{pickedLabel}</PickedBadge>
          </span>
        ) : null}
      </span>
      <span className={`${styles.price} num`}>
        {price}
        {unit ? <span className={styles.unit}>{unit}</span> : null}
        {roomCost ? (
          <span className={styles.roomCost}>
            {roomCostLabel ? (
              <span className={styles.roomCostLabel}>{roomCostLabel}</span>
            ) : null}
            {roomCost}
          </span>
        ) : null}
      </span>
    </button>
  );
}
