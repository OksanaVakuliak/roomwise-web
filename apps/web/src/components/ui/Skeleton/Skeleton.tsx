import type { CSSProperties } from 'react';
import styles from './Skeleton.module.css';

export type SkeletonProps = {
  variant?: 'line' | 'block' | 'circle';
  width?: string;
  height?: string;
};

export function Skeleton({ variant = 'line', width, height }: SkeletonProps) {
  return (
    <span
      className={`${styles.root} ${styles[variant]}`}
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
