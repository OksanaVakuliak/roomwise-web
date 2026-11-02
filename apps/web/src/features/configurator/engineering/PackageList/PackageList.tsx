'use client';

import { useTranslations } from 'next-intl';
import { useId } from 'react';
import { SectionHeader } from '@/components/ui';
import { useEngineering } from '@/lib/api/catalog';
import type { RoomPricing } from '../../shell/use-room-pricing';
import styles from './PackageList.module.css';

export type PackageListProps = {
  pricing: RoomPricing;
};

export function PackageList({ pricing }: PackageListProps) {
  const t = useTranslations('PackageList');
  const headingId = useId();
  const items = useEngineering().data?.packageItems ?? [];
  const priced = new Map(pricing.pricing.packageItems.map((i) => [i.id, i]));

  if (items.length === 0) {
    return null;
  }

  return (
    <section className={styles.root} aria-labelledby={headingId}>
      <SectionHeader
        id={headingId}
        level={2}
        size="mobile"
        title={t('title')}
      />
      <ul className={styles.list}>
        {items.map((item) => {
          const price = priced.get(item.id) ?? item;
          const line = pricing.line(`ENGINEERING:package:${item.id}`);
          const status = price.includedInBase
            ? t('included')
            : line && line.status === 'OK'
              ? pricing.formatLine(line)
              : price.priceCents !== null
                ? pricing.formatUnitPrice(price.priceCents)
                : null;
          return (
            <li key={item.id} className={styles.item}>
              <div className={styles.row}>
                <h3 className={styles.name}>{item.name}</h3>
                {status ? (
                  <span className={styles.status}>{status}</span>
                ) : null}
              </div>
              <p className={styles.description}>{item.description}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
