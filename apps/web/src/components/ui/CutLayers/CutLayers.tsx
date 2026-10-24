import type { ReactNode } from 'react';
import styles from './CutLayers.module.css';

export type CutLayersProps = {
  label: string;
  children: ReactNode;
};

export function CutLayers({ label, children }: CutLayersProps) {
  return (
    <ul className={styles.root} aria-label={label}>
      {children}
    </ul>
  );
}
