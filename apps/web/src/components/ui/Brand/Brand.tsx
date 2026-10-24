import { cx } from '@/lib/cx';
import styles from './Brand.module.css';

export type BrandProps = {
  name: string;
  caption: string;
  size?: 'mobile' | 'desktop';
  className?: string;
};

export function Brand({
  name,
  caption,
  size = 'mobile',
  className,
}: BrandProps) {
  const classes = cx(styles.root, styles[size], className);

  return (
    <div className={classes}>
      {name} <span className={styles.caption}>{caption}</span>
    </div>
  );
}
