import type { ButtonHTMLAttributes, CSSProperties } from 'react';
import styles from './RoomPlan.module.css';

export type RoomPlanProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'type'
> & {
  name: string;
  details: string;
  lengthCm: number;
  widthCm: number;
  state?: 'default' | 'current';
  size?: 'mobile' | 'desktop';
};

export function RoomPlan({
  name,
  details,
  lengthCm,
  widthCm,
  state = 'default',
  size = 'mobile',
  className,
  ...rest
}: RoomPlanProps) {
  const current = state === 'current';
  const classes = [styles.root, styles[size], current && styles.current]
    .concat(className ?? [])
    .filter(Boolean)
    .join(' ');
  const sketchStyle = {
    '--room-length': lengthCm / 100,
    '--room-width': widthCm / 100,
  } as CSSProperties;

  return (
    <button
      {...rest}
      type="button"
      className={classes}
      aria-current={current ? 'true' : undefined}
    >
      <span className={styles.sketch} style={sketchStyle} aria-hidden="true" />
      <span className={styles.name}>{name}</span>
      <span>{details}</span>
    </button>
  );
}
