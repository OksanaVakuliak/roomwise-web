import type { ReactNode } from 'react';
import { cx } from '@/lib/cx';
import styles from './PageTitle.module.css';

export type PageTitleProps = {
  children: ReactNode;
  className?: string;
};

export function PageTitle({ children, className }: PageTitleProps) {
  return <h1 className={cx(styles.root, className)}>{children}</h1>;
}
