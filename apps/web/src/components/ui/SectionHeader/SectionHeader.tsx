import type { ReactNode } from 'react';
import { cx } from '@/lib/cx';
import styles from './SectionHeader.module.css';

export type SectionHeaderProps = {
  id?: string;
  level?: 2 | 3 | 4;
  size?: 'mobile' | 'desktop';
  title: ReactNode;
  note?: ReactNode;
  amount?: ReactNode;
};

export function SectionHeader({
  id,
  level = 2,
  size = 'mobile',
  title,
  note,
  amount,
}: SectionHeaderProps) {
  const Heading = `h${level}` as const;

  return (
    <div className={cx(styles.root, styles[size])}>
      <Heading id={id} className={styles.title}>
        {title}
      </Heading>
      {note ? <span className={styles.note}>{note}</span> : null}
      {amount ? <span className={`${styles.amount} num`}>{amount}</span> : null}
    </div>
  );
}
