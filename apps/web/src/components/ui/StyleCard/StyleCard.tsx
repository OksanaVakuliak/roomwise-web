import type { ReactNode } from 'react';
import { PickedBadge } from '../PickedBadge/PickedBadge';
import styles from './StyleCard.module.css';

export type StyleCardProps = {
  image: ReactNode;
  name: ReactNode;
  description?: ReactNode;
  selected?: boolean;
  pickedLabel: ReactNode;
  onSelect?: () => void;
};

export function StyleCard({
  image,
  name,
  description,
  selected = false,
  pickedLabel,
  onSelect,
}: StyleCardProps) {
  const classes = [styles.root, selected ? styles.on : '']
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={classes}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className={styles.image} aria-hidden="true">
        {image}
      </span>
      <span className={styles.name}>{name}</span>
      {description ? (
        <span className={styles.description}>{description}</span>
      ) : null}
      {selected ? (
        <span className={styles.picked}>
          <PickedBadge>{pickedLabel}</PickedBadge>
        </span>
      ) : null}
    </button>
  );
}
