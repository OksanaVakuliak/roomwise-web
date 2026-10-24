'use client';

import {
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Hatch } from '../Hatch/Hatch';
import styles from './ImageWithFallback.module.css';

export type ImageWithFallbackProps = {
  src?: string | null;
  name: string;
  ratio?: string;
};

export function ImageWithFallback({
  src,
  name,
  ratio,
}: ImageWithFallbackProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const handleError = useCallback(() => setFailedSrc(src ?? null), [src]);

  useEffect(() => {
    const image = imageRef.current;
    if (image?.complete && image.naturalWidth === 0) {
      image.src = image.src;
    }
  }, []);

  const failed = !src || failedSrc === src;

  return (
    <span
      className={styles.root}
      style={{ '--image-ratio': ratio } as CSSProperties}
    >
      {failed ? (
        <span className={styles.fallback} role="img" aria-label={name}>
          <span className={styles.hatch}>
            <Hatch material="concrete" />
          </span>
          <span className={styles.name}>{name}</span>
        </span>
      ) : (
        <img
          ref={imageRef}
          className={styles.image}
          src={src}
          alt={name}
          loading="lazy"
          onError={handleError}
        />
      )}
    </span>
  );
}
