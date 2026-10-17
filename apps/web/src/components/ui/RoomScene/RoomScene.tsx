import { type CSSProperties, useId } from 'react';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden';
import { computeGeometry, type Label } from './geometry';
import styles from './RoomScene.module.css';

export type RoomSceneProps = {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  lengthLabel: string;
  widthLabel: string;
  heightLabel: string;
  cutLabel: string;
  description: string;
  size?: 'mobile' | 'desktop';
};

export function RoomScene({
  lengthCm,
  widthCm,
  heightCm,
  lengthLabel,
  widthLabel,
  heightLabel,
  cutLabel,
  description,
  size = 'mobile',
}: RoomSceneProps) {
  const descriptionId = useId();
  const geometry = computeGeometry(lengthCm, widthCm, heightCm);
  const { cutLine, backLeft } = geometry;

  const labels: { label: Label; text: string; className: string }[] = [
    { label: geometry.width, text: widthLabel, className: styles.dim },
    { label: geometry.length, text: lengthLabel, className: styles.dim },
    { label: geometry.height, text: heightLabel, className: styles.dim },
    { label: geometry.cutStart, text: cutLabel, className: styles.cutmark },
    { label: geometry.cutEnd, text: cutLabel, className: styles.cutmark },
  ];

  return (
    <div className={`${styles.root} ${styles[size]}`}>
      <VisuallyHidden>
        <span id={descriptionId}>{description}</span>
      </VisuallyHidden>
      <div className={styles.scene} role="img" aria-labelledby={descriptionId}>
        <svg
          className={styles.svg}
          viewBox={geometry.viewBox}
          aria-hidden="true"
          focusable="false"
        >
          <polygon className={styles.floor} points={geometry.floor} />
          <polygon className={styles.wall} points={geometry.rightWall} />
          <polygon className={styles.wallShade} points={geometry.leftWall} />
          <polyline className={styles.outline} points={geometry.outline} />
          <polyline className={styles.outline} points={geometry.edges} />
          <line className={styles.outline} {...backLeft} />
          {geometry.dimensionPaths.map((path) => (
            <path key={path} className={styles.dimension} d={path} />
          ))}
          <line className={styles.cut} {...cutLine} />
          <path className={styles.cutTick} d={geometry.cutTicks} />
        </svg>
        {labels.map(({ label, text, className }) => {
          const { left, top } = geometry.place(label);
          const style = {
            '--x': left,
            '--y': top,
            '--rotation': `${label.rotation}deg`,
          } as CSSProperties;
          return (
            <span
              key={`${label.x}:${label.y}`}
              className={className}
              style={style}
              aria-hidden="true"
            >
              {text}
            </span>
          );
        })}
      </div>
    </div>
  );
}
