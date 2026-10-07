import type { ReactNode } from 'react';
import styles from './VisuallyHidden.module.css';

export type VisuallyHiddenProps = {
  children: ReactNode;
  as?: 'span' | 'div';
};

export function VisuallyHidden({
  children,
  as: Tag = 'span',
}: VisuallyHiddenProps) {
  return <Tag className={styles.root}>{children}</Tag>;
}
