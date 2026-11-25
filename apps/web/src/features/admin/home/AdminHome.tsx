'use client';

import { useTranslations } from 'next-intl';
import { useId } from 'react';
import {
  Link,
  PageTitle,
  SectionHeader,
  Skeleton,
  VisuallyHidden,
} from '@/components/ui';
import { useNewLeadsCount } from '@/lib/admin-api/leads';
import { NAV_GROUPS } from '../shell/AdminShell/nav';
import styles from './AdminHome.module.css';

export function AdminHome() {
  const t = useTranslations('AdminHome');
  const tNav = useTranslations('AdminNav');
  const leads = useNewLeadsCount();
  const leadsId = useId();
  const sectionsId = useId();

  return (
    <div className={styles.root}>
      <PageTitle>{t('title')}</PageTitle>
      <section aria-labelledby={leadsId} className={styles.leads}>
        <SectionHeader id={leadsId} title={t('leadsTitle')} />
        {leads.data !== undefined ? (
          <Link href="/admin/leads?status=NEW" className={styles.leadsLink}>
            {t('newLeads', { count: leads.data })}
          </Link>
        ) : leads.isError ? (
          <p role="alert" className={styles.error}>
            {t('leadsFailed')}
          </p>
        ) : (
          <div role="status">
            <VisuallyHidden>{t('leadsLoading')}</VisuallyHidden>
            <Skeleton variant="block" height="3rem" />
          </div>
        )}
      </section>
      <section aria-labelledby={sectionsId}>
        <SectionHeader id={sectionsId} title={t('sections')} />
        <ul className={styles.cards}>
          {NAV_GROUPS.map((group) => (
            <li key={group.key} className={styles.card}>
              {group.items.length === 1 ? (
                <Link href={group.items[0].href} className={styles.cardLink}>
                  {tNav(group.items[0].key)}
                </Link>
              ) : (
                <>
                  <h3 className={styles.cardTitle}>{tNav(group.key)}</h3>
                  <ul className={styles.cardList}>
                    {group.items.map((item) => (
                      <li key={item.key}>
                        <Link href={item.href} className={styles.cardLink}>
                          {tNav(item.key)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
