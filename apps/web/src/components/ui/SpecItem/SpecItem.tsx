import type { ReactNode } from 'react';
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
  fit?: SpecItemFit;
  fitLabel?: ReactNode;
  selected?: boolean;
  pickedLabel: ReactNode;
  price: ReactNode;
  unit?: ReactNode;
  onSelect?: () => void;
};

export function SpecItem({
  position,
  size = 'mobile',
  image,
  name,
  brand,
  dimensions,
  fit,
  fitLabel,
  selected = false,
  pickedLabel,
  price,
  unit,
  onSelect,
}: SpecItemProps) {
  const classes = [styles.root, styles[size], selected ? styles.on : '']
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={classes}
      aria-pressed={selected}
      onClick={onSelect}
    >
      {selected ? <span className={styles.bar} aria-hidden="true" /> : null}
      <span className={styles.position}>{position}</span>
      <span className={styles.image} aria-hidden="true">
        {image}
      </span>
      <span className={styles.body}>
        <span className={styles.name}>{name}</span>
        {brand || dimensions ? (
          <span className={styles.details}>
            {brand ? <span className={styles.brand}>{brand}</span> : null}
            {dimensions ? <span>{dimensions}</span> : null}
          </span>
        ) : null}
        {fit && fitLabel ? (
          <span className={`${styles.fit} ${styles[fit]}`}>{fitLabel}</span>
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
      </span>
    </button>
  );
}
