import type { CSSProperties } from 'react';
import { cx } from '@/lib/cx';
import styles from './StackBar.module.css';

export type StackBarSegment = {
  key: string;
  share: number;
};

export type StackBarProps = {
  segments: readonly StackBarSegment[];
  label: string;
  className?: string;
};

export function StackBar({ segments, label, className }: StackBarProps) {
  const classes = cx(styles.root, className);

  return (
    <div role="img" aria-label={label} className={classes}>
      {segments.map((segment) => (
        <i
          key={segment.key}
          className={styles.segment}
          style={{ '--share': `${segment.share}%` } as CSSProperties}
        />
      ))}
    </div>
  );
}
