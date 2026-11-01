import { type CSSProperties, useId } from 'react';
import { cx } from '@/lib/cx';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden';
import { computeGeometry, type Label } from './geometry';
import styles from './RoomScene.module.css';

export type SceneSurface = {
  textureUrl: string;
  tileWidthMm: number;
  tileLengthMm: number;
  fallbackColor: string;
};

export type SceneSurfaces = {
  floor?: SceneSurface;
  walls?: SceneSurface;
};

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
  surfaces?: SceneSurfaces;
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
  surfaces,
}: RoomSceneProps) {
  const descriptionId = useId();
  const patternPrefix = useId();
  const geometry = computeGeometry(lengthCm, widthCm, heightCm);
  const { cutLine, backLeft } = geometry;

  const labels: { label: Label; text: string; className: string }[] = [
    { label: geometry.width, text: widthLabel, className: styles.dim },
    { label: geometry.length, text: lengthLabel, className: styles.dim },
    { label: geometry.height, text: heightLabel, className: styles.dim },
    { label: geometry.cutStart, text: cutLabel, className: styles.cutmark },
    { label: geometry.cutEnd, text: cutLabel, className: styles.cutmark },
  ];

  const faces: {
    key: string;
    surface: SceneSurface | undefined;
    points: string;
    transform: string;
    shaded: boolean;
  }[] = [
    {
      key: 'floor',
      surface: surfaces?.floor,
      points: geometry.floor,
      transform: geometry.floorTransform,
      shaded: false,
    },
    {
      key: 'rightWall',
      surface: surfaces?.walls,
      points: geometry.rightWall,
      transform: geometry.rightWallTransform,
      shaded: false,
    },
    {
      key: 'leftWall',
      surface: surfaces?.walls,
      points: geometry.leftWall,
      transform: geometry.leftWallTransform,
      shaded: true,
    },
  ];

  return (
    <div className={cx(styles.root, styles[size])}>
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
          {faces.map(({ key, surface, points, transform, shaded }) => {
            if (!surface) {
              return null;
            }
            const patternId = `${patternPrefix}-${key}`;
            const isFloor = key === 'floor';
            const across = geometry.tileUnit(
              isFloor ? surface.tileLengthMm : surface.tileWidthMm,
            );
            const down = geometry.tileUnit(
              isFloor ? surface.tileWidthMm : surface.tileLengthMm,
            );
            return (
              <g key={key} data-surface={key}>
                <defs>
                  <pattern
                    id={patternId}
                    width={across}
                    height={down}
                    patternUnits="userSpaceOnUse"
                    patternTransform={transform}
                  >
                    <image
                      href={surface.textureUrl}
                      width={across}
                      height={down}
                      preserveAspectRatio="none"
                    />
                  </pattern>
                </defs>
                <polygon points={points} fill={surface.fallbackColor} />
                <polygon points={points} fill={`url(#${patternId})`} />
                {shaded ? (
                  <polygon className={styles.shade} points={points} />
                ) : null}
              </g>
            );
          })}
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
