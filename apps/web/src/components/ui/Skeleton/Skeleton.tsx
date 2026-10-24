import type { CSSProperties } from 'react';
import { cx } from '@/lib/cx';
import styles from './Skeleton.module.css';

export type SkeletonProps = {
  variant?: 'line' | 'block' | 'circle';
  width?: string;
  height?: string;
};

export function Skeleton({ variant = 'line', width, height }: SkeletonProps) {
  return (
    <span
      className={cx(styles.root, styles[variant])}
      style={
        {
          '--skeleton-width': width,
          '--skeleton-height': height,
        } as CSSProperties
      }
      aria-hidden="true"
    />
  );
}
