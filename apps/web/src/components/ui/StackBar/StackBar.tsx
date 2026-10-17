import type { CSSProperties } from 'react';
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
  const classes = [styles.root, className].filter(Boolean).join(' ');

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
