import type { CSSProperties, ReactNode } from 'react';
import { cx } from '@/lib/cx';
import styles from './CostBar.module.css';

export type CostBarProps = {
  label: ReactNode;
  share: number;
  value: ReactNode;
  className?: string;
};

export function CostBar({ label, share, value, className }: CostBarProps) {
  const classes = cx(styles.root, className);

  return (
    <div className={classes}>
      <span className={styles.label}>{label}</span>
      <span className={styles.track} aria-hidden="true">
        <i
          className={styles.fill}
          style={{ '--share': `${share}%` } as CSSProperties}
        />
      </span>
      <b className={`${styles.value} num`}>{value}</b>
    </div>
  );
}
