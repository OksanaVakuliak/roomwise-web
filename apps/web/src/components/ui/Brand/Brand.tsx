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
  const classes = [styles.root, styles[size], className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      {name} <span className={styles.caption}>{caption}</span>
    </div>
  );
}
