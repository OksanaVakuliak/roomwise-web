import { useTranslations } from 'next-intl';
import { Skeleton, VisuallyHidden } from '@/components/ui';
import styles from './ZoneSkeleton.module.css';

export type ZoneKind = 'showcase' | 'rooms' | 'specification' | 'estimate';

export type ZoneSkeletonKind =
  | ZoneKind
  | 'interior'
  | 'engineering'
  | 'style'
  | 'object'
  | 'plan'
  | 'picker'
  | 'scene'
  | 'nav';

export type ZoneSkeletonProps = {
  kind: ZoneSkeletonKind;
};

const ROOM_ROWS = [0, 1, 2];
const SPEC_ROWS = [0, 1, 2, 3, 4];
const ESTIMATE_PARTS = [0, 1, 2, 3];
const CHOSEN_SECTIONS = [0, 1];
const CHOSEN_ROWS = [0, 1, 2];
const PLAN_TILES = [0, 1, 2];
const ENGINEERING_SECTIONS = [0, 1];
const ENGINEERING_ROWS = [0, 1, 2];
const STYLE_CARDS = [0, 1, 2, 3, 4, 5];
const FORM_FIELDS = [0, 1, 2, 3];
const PICKER_TABS = [0, 1, 2];
const PICKER_ITEMS = [0, 1, 2, 3];
const SCENE_ACTIONS = [0, 1, 2];

function ShowcaseLayout() {
  return (
    <div className={styles.chosen}>
      {CHOSEN_SECTIONS.map((section) => (
        <div key={section} className={styles.chosenSection}>
          <div className={styles.chosenHeader}>
            <Skeleton width="40%" />
            <Skeleton width="4rem" />
          </div>
          <div className={styles.chosenRows}>
            {CHOSEN_ROWS.map((row) => (
              <div key={row} className={styles.chosenRow}>
                <Skeleton
                  variant="block"
                  width="var(--chosen-image)"
                  height="var(--chosen-image)"
                />
                <div className={styles.chosenLines}>
                  <Skeleton width="45%" />
                  <Skeleton width="70%" />
                </div>
                <Skeleton width="4rem" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PlanTiles() {
  return (
    <div className={styles.planTiles}>
      {PLAN_TILES.map((tile) => (
        <div key={tile} className={styles.planTile}>
          <Skeleton
            variant="block"
            width="calc(4 * var(--plan-scale))"
            height="calc(3 * var(--plan-scale))"
          />
          <Skeleton width="3rem" />
          <Skeleton width="2rem" />
        </div>
      ))}
    </div>
  );
}

function InteriorLayout() {
  return (
    <div className={styles.step}>
      <PlanTiles />
      <div className={styles.stepTitle}>
        <Skeleton width="45%" height="var(--text-display-l-size)" />
        <div className={styles.lines}>
          <Skeleton width="4rem" />
          <Skeleton width="6rem" />
        </div>
      </div>
    </div>
  );
}

function PlanLayout() {
  return (
    <div className={styles.plan}>
      <div className={styles.sectionHeader}>
        <Skeleton width="30%" height="var(--text-title-s-size)" />
        <Skeleton width="4rem" />
      </div>
      <PlanTiles />
      <Skeleton width="50%" />
    </div>
  );
}

function EngineeringLayout() {
  return (
    <div className={styles.step}>
      {ENGINEERING_SECTIONS.map((section) => (
        <div key={section} className={styles.engineeringSection}>
          <Skeleton width="35%" height="var(--text-title-s-size)" />
          {ENGINEERING_ROWS.map((row) => (
            <Skeleton key={row} variant="block" height="var(--size-target)" />
          ))}
        </div>
      ))}
    </div>
  );
}

function StyleLayout() {
  return (
    <div className={styles.styleGrid}>
      {STYLE_CARDS.map((card) => (
        <div key={card} className={styles.styleCard}>
          <Skeleton variant="block" />
          <Skeleton width="60%" />
          <Skeleton variant="block" height="var(--size-compact)" />
        </div>
      ))}
    </div>
  );
}

function ObjectLayout() {
  return (
    <div className={styles.step}>
      <div className={styles.formGrid}>
        {FORM_FIELDS.map((field) => (
          <div key={field} className={styles.field}>
            <Skeleton width="40%" />
            <Skeleton variant="block" height="var(--size-target)" />
          </div>
        ))}
      </div>
      <Skeleton variant="block" height="var(--size-target)" />
    </div>
  );
}

function PickerLayout() {
  return (
    <div className={styles.picker}>
      <div className={styles.sectionHeader}>
        <Skeleton width="40%" height="var(--text-title-s-size)" />
      </div>
      <div className={styles.pickerTabs}>
        {PICKER_TABS.map((tab) => (
          <Skeleton
            key={tab}
            variant="block"
            width="5rem"
            height="var(--size-compact)"
          />
        ))}
      </div>
      <div>
        {PICKER_ITEMS.map((item) => (
          <div key={item} className={styles.specItem}>
            <Skeleton
              variant="block"
              width="var(--spec-image)"
              height="var(--spec-image)"
            />
            <div className={styles.lines}>
              <Skeleton width="65%" />
              <Skeleton width="45%" />
            </div>
            <Skeleton width="4rem" />
            <div className={styles.specActions}>
              <Skeleton
                variant="block"
                width="6rem"
                height="var(--size-compact)"
              />
              <Skeleton
                variant="block"
                width="4rem"
                height="var(--size-compact)"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SceneLayout() {
  return (
    <div className={styles.scene}>
      <div className={styles.stage}>
        <Skeleton variant="block" height="100%" />
      </div>
      <div className={styles.sceneActions}>
        {SCENE_ACTIONS.map((action) => (
          <Skeleton
            key={action}
            variant="block"
            width="var(--size-target)"
            height="var(--size-target)"
          />
        ))}
      </div>
    </div>
  );
}

function NavLayout() {
  return (
    <div className={styles.nav}>
      <Skeleton variant="block" height="var(--size-button)" />
      <Skeleton variant="block" height="var(--size-button)" />
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
    <div className={styles.estimate}>
      <div className={styles.estimateTotal}>
        <Skeleton width="30%" />
        <Skeleton width="6rem" height="var(--text-number-s-size)" />
      </div>
      <div className={styles.estimateBar}>
        <Skeleton variant="block" height="var(--bar-stack-height)" />
      </div>
      <div className={styles.estimateParts}>
        {ESTIMATE_PARTS.map((part) => (
          <div key={part} className={styles.lines}>
            <Skeleton width="60%" />
            <Skeleton width="80%" height="var(--text-body-default-size)" />
          </div>
        ))}
      </div>
    </div>
  );
}

const LAYOUTS = {
  showcase: ShowcaseLayout,
  rooms: RoomsLayout,
  specification: SpecificationLayout,
  estimate: EstimateLayout,
  interior: InteriorLayout,
  engineering: EngineeringLayout,
  style: StyleLayout,
  object: ObjectLayout,
  plan: PlanLayout,
  picker: PickerLayout,
  scene: SceneLayout,
  nav: NavLayout,
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
