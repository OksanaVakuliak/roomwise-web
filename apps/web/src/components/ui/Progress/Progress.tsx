import type { CSSProperties } from 'react';
import { cx } from '@/lib/cx';
import styles from './Progress.module.css';

export type ProgressProps = {
  label: string;
  value?: number;
  max?: number;
  valueText?: string;
  caption?: string;
};

export function Progress({
  label,
  value,
  max = 100,
  valueText,
  caption,
}: ProgressProps) {
  const determinate = value !== undefined && max > 0;
  const clamped = determinate ? Math.min(Math.max(value ?? 0, 0), max) : 0;
  const percent = (clamped / max) * 100;
  const fillWidth = determinate ? `${percent}%` : undefined;

  return (
    <div className={styles.root}>
      {caption ? <span className={styles.caption}>{caption}</span> : null}
      <div
        className={cx(styles.track, !determinate && styles.indeterminate)}
        role="progressbar"
        aria-label={label}
        aria-valuemin={determinate ? 0 : undefined}
        aria-valuemax={determinate ? max : undefined}
        aria-valuenow={determinate ? clamped : undefined}
        aria-valuetext={determinate ? valueText : undefined}
      >
        <span
          className={styles.fill}
          style={{ '--progress': fillWidth } as CSSProperties}
        />
      </div>
    </div>
  );
}
