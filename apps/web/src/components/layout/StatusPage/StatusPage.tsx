import type { ReactNode } from 'react';
import { PageTitle } from '@/components/ui';
import styles from './StatusPage.module.css';

export type StatusPageProps = {
  title: string;
  message: string;
  children?: ReactNode;
};

export function StatusPage({ title, message, children }: StatusPageProps) {
  return (
    <section className={styles.root}>
      <PageTitle>{title}</PageTitle>
      <p className={styles.message}>{message}</p>
      {children ? <div className={styles.actions}>{children}</div> : null}
    </section>
  );
}
