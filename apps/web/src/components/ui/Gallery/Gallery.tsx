'use client';

import {
  type KeyboardEvent,
  type MouseEvent,
  useCallback,
  useRef,
  useState,
} from 'react';
import { cx } from '@/lib/cx';
import { ImageWithFallback } from '../ImageWithFallback/ImageWithFallback';
import styles from './Gallery.module.css';

export type GalleryImage = {
  src?: string | null;
  name: string;
};

export type GalleryProps = {
  label: string;
  images: GalleryImage[];
  thumbnailLabel: (index: number, total: number) => string;
  defaultIndex?: number;
  ratio?: string;
  className?: string;
};

export function Gallery({
  label,
  images,
  thumbnailLabel,
  defaultIndex = 0,
  ratio = '4 / 3',
  className,
}: GalleryProps) {
  const [requested, setRequested] = useState(defaultIndex);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const active = Math.min(Math.max(requested, 0), images.length - 1);
  const current = images[active];

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      const total = images.length;
      let next: number;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown')
        next = (active + 1) % total;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp')
        next = (active - 1 + total) % total;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = total - 1;
      else return;

      event.preventDefault();
      setRequested(next);
      thumbsRef.current
        ?.querySelectorAll<HTMLButtonElement>('button')
        [next]?.focus();
    },
    [active, images.length],
  );

  const handleClick = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    setRequested(Number(event.currentTarget.dataset.index));
  }, []);

  if (!current) return null;

  return (
    <div
      role="group"
      aria-roledescription="gallery"
      aria-label={label}
      className={cx(styles.root, className)}
    >
      <div className={styles.main}>
        <ImageWithFallback
          src={current.src}
          name={current.name}
          ratio={ratio}
        />
      </div>
      {images.length > 1 ? (
        <div ref={thumbsRef} className={styles.thumbs}>
          {images.map((image, index) => (
            <button
              key={`${image.src}${image.name}`}
              type="button"
              className={cx(styles.thumb, index === active && styles.on)}
              aria-label={thumbnailLabel(index + 1, images.length)}
              aria-current={index === active ? 'true' : undefined}
              tabIndex={index === active ? 0 : -1}
              data-index={index}
              onClick={handleClick}
              onKeyDown={handleKeyDown}
            >
              <ImageWithFallback src={image.src} name={image.name} ratio="1" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
