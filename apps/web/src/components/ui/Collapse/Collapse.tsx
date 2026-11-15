import type { ReactNode } from 'react';
import { cx } from '@/lib/cx';
import styles from './Collapse.module.css';

export type CollapseProps = {
  id: string;
  open: boolean;
  className?: string;
  children: ReactNode;
};

export function Collapse({ id, open, className, children }: CollapseProps) {
  return (
    <div
      id={id}
      className={cx(styles.root, open && styles.open, className)}
      inert={!open}
      aria-hidden={!open}
    >
      <div className={styles.inner}>{children}</div>
    </div>
  );
}
