import type { ReactNode } from 'react';
import styles from './StatusPage.module.css';

export type StatusPageProps = {
  title: string;
  message: string;
  children?: ReactNode;
};

export function StatusPage({ title, message, children }: StatusPageProps) {
  return (
    <section className={styles.root}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.message}>{message}</p>
      {children ? <div className={styles.actions}>{children}</div> : null}
    </section>
  );
}
