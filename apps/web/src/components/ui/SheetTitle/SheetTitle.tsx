import type { ReactNode } from 'react';
import { cx } from '@/lib/cx';
import styles from './SheetTitle.module.css';

export type SheetTitleProps = {
  title: ReactNode;
  primary: ReactNode;
  secondary?: ReactNode;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  size?: 'mobile' | 'desktop';
};

export function SheetTitle({
  title,
  primary,
  secondary,
  headingLevel = 1,
  size = 'mobile',
}: SheetTitleProps) {
  const Heading = `h${headingLevel}` as const;

  return (
    <div className={cx(styles.root, styles[size])}>
      <Heading className={styles.heading}>{title}</Heading>
      <p className={styles.meta}>
        <b className={styles.primary}>{primary}</b>
        {secondary}
      </p>
    </div>
  );
}
