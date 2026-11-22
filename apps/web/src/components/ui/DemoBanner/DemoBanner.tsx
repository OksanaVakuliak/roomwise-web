'use client';

import { useFormatter } from 'next-intl';
import { useEffect, useState } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './DemoBanner.module.css';

export type DemoBannerProps = {
  resetAt: string;
  label: string;
};

export function DemoBanner({ resetAt, label }: DemoBannerProps) {
  const format = useFormatter();
  const [announced, setAnnounced] = useState(false);
  const reset = new Date(resetAt);
  const valid = !Number.isNaN(reset.getTime());

  useEffect(() => {
    setAnnounced(true);
  }, []);

  return (
    <div className={styles.root} role="status">
      <Icon name="info" size="lg" className={styles.icon} />
      <p className={styles.text}>
        {announced ? (
          <>
            {label}
            {valid ? (
              <>
                {' '}
                <time className={styles.time} dateTime={resetAt}>
                  {format.dateTime(reset, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </time>
              </>
            ) : null}
          </>
        ) : null}
      </p>
    </div>
  );
}
