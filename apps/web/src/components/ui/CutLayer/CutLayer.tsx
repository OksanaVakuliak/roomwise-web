import type { CSSProperties, ReactNode } from 'react';
import { cx } from '@/lib/cx';
import { Hatch, type HatchMaterial } from '../Hatch/Hatch';
import { RevisionMark } from '../RevisionMark/RevisionMark';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden';
import styles from './CutLayer.module.css';

export type CutLayerKind = 'problem' | 'new' | 'included';

export type CutLayerProps = {
  kind: CutLayerKind;
  kindLabel: string;
  position: 'first' | 'rest';
  size?: 'mobile' | 'desktop';
  material: HatchMaterial;
  thickness: number;
  name: ReactNode;
  note: ReactNode;
  price: ReactNode;
  revision?: { number: number; label: string };
  remarkId?: string;
};

const cloudPath =
  'M8 30 C0 18 12 4 26 10 C32 0 50 0 56 9 C64 0 82 0 88 9 C96 0 114 0 120 9 C128 0 146 0 152 9 C160 0 178 0 184 9 C192 0 210 0 216 9 C224 0 242 0 248 9 C256 0 274 0 280 9 C288 0 306 0 312 9 C320 0 338 0 344 9 C352 0 370 0 376 10 C392 6 400 22 392 30 C400 40 390 56 376 50 C370 60 352 60 344 51 C338 60 320 60 312 51 C306 60 288 60 280 51 C274 60 256 60 248 51 C242 60 224 60 216 51 C210 60 192 60 184 51 C178 60 160 60 152 51 C146 60 128 60 120 51 C114 60 96 60 88 51 C82 60 64 60 56 51 C50 60 32 60 26 50 C10 56 0 42 8 30Z';

export function CutLayer({
  kind,
  kindLabel,
  position,
  size = 'mobile',
  material,
  thickness,
  name,
  note,
  price,
  revision,
  remarkId,
}: CutLayerProps) {
  const classes = cx(styles.root, styles[kind], styles[position], styles[size]);

  return (
    <li
      className={classes}
      style={{ '--h': `${thickness}px` } as CSSProperties}
      aria-describedby={remarkId}
      data-kind={kind}
    >
      <div className={styles.block}>
        <Hatch material={material} />
      </div>
      <i className={styles.leader} aria-hidden="true" />
      <div className={styles.label}>
        <b>{name}</b>
        <span>{note}</span>
        <VisuallyHidden>{kindLabel}</VisuallyHidden>
      </div>
      <span className={styles.price}>{price}</span>
      {kind === 'problem' ? (
        <div className={styles.cloud} aria-hidden="true">
          <svg viewBox="0 0 400 60" preserveAspectRatio="none">
            <path
              vectorEffect="non-scaling-stroke"
              d={cloudPath}
              fill="none"
              stroke="var(--heat)"
            />
          </svg>
        </div>
      ) : null}
      {revision ? (
        <span className={styles.mark}>
          <RevisionMark
            number={revision.number}
            label={revision.label}
            size={size}
          />
        </span>
      ) : null}
    </li>
  );
}
