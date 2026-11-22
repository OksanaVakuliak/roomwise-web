import { useTranslations } from 'next-intl';
import { VisuallyHidden } from '@/components/ui';
import { Link, usePathname } from '@/i18n/navigation';
import styles from './AdminShell.module.css';
import { isActive, NAV_GROUPS, NAV_HOME, type NavItem } from './nav';

type AdminNavigationProps = {
  newLeads?: number;
};

export function AdminNavigation({ newLeads = 0 }: AdminNavigationProps) {
  const t = useTranslations('AdminNav');
  const pathname = usePathname();

  const renderItem = (item: NavItem) => (
    <li key={item.key}>
      <Link
        href={item.href}
        className={styles.link}
        aria-current={isActive(pathname, item.href) ? 'page' : undefined}
      >
        {t(item.key)}
        {item.key === 'leads' && newLeads > 0 ? (
          <>
            <span className={styles.count} aria-hidden="true">
              {newLeads}
            </span>
            <VisuallyHidden>
              {t('newLeads', { count: newLeads })}
            </VisuallyHidden>
          </>
        ) : null}
      </Link>
    </li>
  );

  return (
    <nav aria-label={t('label')}>
      <ul className={styles.list}>
        {renderItem(NAV_HOME)}
        {NAV_GROUPS.map((group) =>
          group.items.length === 1 ? (
            renderItem(group.items[0])
          ) : (
            <li key={group.key}>
              <p className={styles.group}>{t(group.key)}</p>
              <ul className={styles.list}>{group.items.map(renderItem)}</ul>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}
