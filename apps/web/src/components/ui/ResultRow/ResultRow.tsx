import type { ReactNode } from 'react';
import styles from './ResultRow.module.css';

export type ResultRowProps = {
  variant?: 'default' | 'new';
  position: ReactNode;
  title: ReactNode;
  note?: ReactNode;
  value: ReactNode;
  className?: string;
};

export function ResultRow({
  variant = 'default',
  position,
  title,
  note,
  value,
  className,
}: ResultRowProps) {
  const classes = [styles.root, styles[variant], className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <span className={`${styles.position} num`}>{position}</span>
      <div>
        {title}
        {note ? <span className={styles.note}>{note}</span> : null}
      </div>
      <b className={`${styles.value} num`}>{value}</b>
    </div>
  );
}
