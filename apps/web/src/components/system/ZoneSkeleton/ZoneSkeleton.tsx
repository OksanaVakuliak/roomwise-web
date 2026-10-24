import { useTranslations } from 'next-intl';
import { Skeleton, VisuallyHidden } from '@/components/ui';
import styles from './ZoneSkeleton.module.css';

export type ZoneKind = 'showcase' | 'rooms' | 'specification' | 'estimate';

export type ZoneSkeletonProps = {
  kind: ZoneKind;
};

const SHOWCASE_CARDS = [0, 1, 2, 3];
const ROOM_ROWS = [0, 1, 2];
const SPEC_ROWS = [0, 1, 2, 3, 4];
const ESTIMATE_ROWS = [0, 1, 2, 3];

function ShowcaseLayout() {
  return (
    <div className={styles.cards}>
      {SHOWCASE_CARDS.map((card) => (
        <div key={card} className={styles.card}>
          <Skeleton variant="block" height="7.5rem" />
          <Skeleton width="70%" />
          <Skeleton width="40%" />
        </div>
      ))}
    </div>
  );
}

function RoomsLayout() {
  return (
    <div className={styles.rows}>
      {ROOM_ROWS.map((row) => (
        <div key={row} className={styles.roomRow}>
          <Skeleton variant="circle" />
          <div className={styles.lines}>
            <Skeleton width="55%" />
            <Skeleton width="35%" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SpecificationLayout() {
  return (
    <div className={styles.rows}>
      {SPEC_ROWS.map((row) => (
        <div key={row} className={styles.specRow}>
          <Skeleton width="2rem" />
          <div className={styles.lines}>
            <Skeleton width="65%" />
            <Skeleton width="45%" />
          </div>
          <Skeleton width="4rem" />
        </div>
      ))}
    </div>
  );
}

function EstimateLayout() {
  return (
    <div className={styles.rows}>
      <Skeleton variant="block" height="1.5rem" />
      {ESTIMATE_ROWS.map((row) => (
        <div key={row} className={styles.estimateRow}>
          <Skeleton width="40%" />
          <Skeleton width="4rem" />
        </div>
      ))}
      <div className={styles.total}>
        <Skeleton width="30%" />
        <Skeleton width="6rem" height="1.5rem" />
      </div>
    </div>
  );
}

const LAYOUTS = {
  showcase: ShowcaseLayout,
  rooms: RoomsLayout,
  specification: SpecificationLayout,
  estimate: EstimateLayout,
} as const;

export function ZoneSkeleton({ kind }: ZoneSkeletonProps) {
  const t = useTranslations('ZoneStates.loading');
  const Layout = LAYOUTS[kind];

  return (
    <div className={styles.root} aria-busy="true">
      <VisuallyHidden>{t(kind)}</VisuallyHidden>
      <Layout />
    </div>
  );
}
