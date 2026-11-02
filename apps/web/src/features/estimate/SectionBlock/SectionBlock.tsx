import type { ReactNode } from 'react';
import { SectionHeader } from '@/components/ui';
import styles from './SectionBlock.module.css';

export type SectionBlockProps = {
  id: string;
  level: 2 | 3;
  title: ReactNode;
  amount?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
};

export function SectionBlock({
  id,
  level,
  title,
  amount,
  action,
  children,
}: SectionBlockProps) {
  return (
    <section className={styles.root} aria-labelledby={id}>
      <SectionHeader id={id} level={level} title={title} amount={amount} />
      {action ? <div className={styles.action}>{action}</div> : null}
      {children}
    </section>
  );
}
