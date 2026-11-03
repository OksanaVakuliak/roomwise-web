'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useId } from 'react';
import { Link } from '@/components/ui';
import { calculationPath } from '@/config/routes';
import type { VersionView } from '@/lib/api/calculations';
import { cx } from '@/lib/cx';
import { moneyMinor, rateDate } from '@/lib/format';
import styles from './VersionList.module.css';

export type VersionListProps = {
  version: VersionView;
};

export function VersionList({ version }: VersionListProps) {
  const t = useTranslations('CalculationPage.versions');
  const locale = useLocale();
  const titleId = useId();

  if (version.versions.length < 2) {
    return null;
  }

  return (
    <section className={styles.root} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.title}>
        {t('title')}
      </h2>
      <ul className={styles.list}>
        {version.versions.map((entry) => {
          const current = entry.number === version.number;
          const label = t('item', { number: entry.number });
          return (
            <li
              key={entry.number}
              className={cx(styles.item, current && styles.current)}
            >
              {current ? (
                <span aria-current="page">{label}</span>
              ) : (
                <Link href={calculationPath(version.publicId, entry.number)}>
                  {label}
                </Link>
              )}
              <span>{rateDate(entry.createdAt, locale)}</span>
              <span className={styles.total}>
                {moneyMinor(entry.totalUsdCents, 'USD', locale)}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
