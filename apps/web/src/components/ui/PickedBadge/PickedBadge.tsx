import type { ReactNode } from 'react';
import styles from './PickedBadge.module.css';

export type PickedBadgeProps = {
  children: ReactNode;
};

export function PickedBadge({ children }: PickedBadgeProps) {
  return <span className={styles.root}>{children}</span>;
}
