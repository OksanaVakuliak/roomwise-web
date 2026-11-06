'use client';

import { useTranslations } from 'next-intl';
import styles from './ExpiredBadge.module.css';

export function ExpiredBadge() {
  const t = useTranslations('CalculationPage');

  return <span className={styles.root}>{t('expiredBadge')}</span>;
}
