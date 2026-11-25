import type { CSSProperties } from 'react';
import { cx } from '@/lib/cx';
import styles from './TexturePreview.module.css';

const DEFAULT_AREA_MM = 2000;

export type TexturePreviewProps = {
  src?: string;
  tileWidthMm: number;
  tileLengthMm: number;
  fallbackColor: string;
  areaMm?: number;
  label: string;
  className?: string;
};

export function TexturePreview({
  src,
  tileWidthMm,
  tileLengthMm,
  fallbackColor,
  areaMm = DEFAULT_AREA_MM,
  label,
  className,
}: TexturePreviewProps) {
  const vars: Record<string, string> = {
    '--tile-w': `${(tileWidthMm / areaMm) * 100}%`,
    '--tile-l': `${(tileLengthMm / areaMm) * 100}%`,
    '--fallback': fallbackColor,
  };
  if (src) vars['--texture'] = `url(${JSON.stringify(src)})`;

  return (
    <div
      role="img"
      aria-label={label}
      className={cx(styles.root, src && styles.textured, className)}
      style={vars as CSSProperties}
    />
  );
}
