import type { CSSProperties, ReactNode } from 'react';
import styles from './CostBar.module.css';

export type CostBarProps = {
  label: ReactNode;
  share: number;
  value: ReactNode;
  className?: string;
};

export function CostBar({ label, share, value, className }: CostBarProps) {
  const classes = [styles.root, className].filter(Boolean).join(' ');

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
