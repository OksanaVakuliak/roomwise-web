import { Skeleton } from '../Skeleton/Skeleton';
import styles from './SpecItemSkeleton.module.css';

export function SpecItemSkeleton() {
  return (
    <div className={styles.root} aria-hidden="true">
      <div className={styles.grid}>
        <div className={styles.media}>
          <Skeleton
            variant="block"
            width="var(--spec-image)"
            height="var(--spec-image)"
          />
        </div>
        <div className={styles.body}>
          <Skeleton width="70%" />
        </div>
        <div className={styles.price}>
          <Skeleton width="var(--bar-value-width)" />
        </div>
        <div className={styles.actions}>
          <Skeleton variant="block" height="var(--size-compact)" />
          <Skeleton variant="block" height="var(--size-compact)" />
          <Skeleton variant="block" height="var(--size-compact)" />
        </div>
      </div>
    </div>
  );
}
