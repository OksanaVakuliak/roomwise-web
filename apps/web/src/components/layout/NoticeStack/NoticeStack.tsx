import type { ReactNode } from 'react';
import styles from './NoticeStack.module.css';

export function NoticeStack({ children }: { children: ReactNode }) {
  return <div className={styles.root}>{children}</div>;
}
