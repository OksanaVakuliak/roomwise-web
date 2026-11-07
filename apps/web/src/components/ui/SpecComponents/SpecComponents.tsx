import type { ReactNode } from 'react';
import styles from './SpecComponents.module.css';

export type SpecComponentsItem = {
  id: string;
  label: ReactNode;
  amount?: ReactNode;
};

export type SpecComponentsProps = {
  items: readonly SpecComponentsItem[];
};

export function SpecComponents({ items }: SpecComponentsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <ul className={styles.root}>
      {items.map((item) => (
        <li key={item.id} className={styles.item}>
          <span className={styles.label}>{item.label}</span>
          {item.amount ? (
            <span className={`${styles.amount} num`}>{item.amount}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
