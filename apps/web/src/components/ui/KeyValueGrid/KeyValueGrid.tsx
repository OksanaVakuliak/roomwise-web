import type { ReactNode } from 'react';
import styles from './KeyValueGrid.module.css';

export type KeyValueItem = {
  key: string;
  label: ReactNode;
  value: ReactNode;
};

export type KeyValueGridProps = {
  items: readonly KeyValueItem[];
  className?: string;
};

export function KeyValueGrid({ items, className }: KeyValueGridProps) {
  const classes = [styles.root, className].filter(Boolean).join(' ');

  return (
    <dl className={classes}>
      {items.map((item) => (
        <div key={item.key} className={styles.item}>
          <dt className={styles.label}>{item.label}</dt>
          <dd className={styles.value}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
