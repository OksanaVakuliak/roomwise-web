'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { type ReactNode, useCallback, useState } from 'react';
import { PreferenceSwitches } from '@/components/layout';
import {
  Brand,
  Button,
  DemoBanner,
  IconButton,
  Link,
  SidePanel,
} from '@/components/ui';
import { getPathname, usePathname } from '@/i18n/navigation';
import { useLogout } from '@/lib/admin-api/auth';
import { useAdminSession } from '../../session';
import { AdminNavigation } from './AdminNavigation';
import styles from './AdminShell.module.css';

export type AdminShellProps = {
  children: ReactNode;
  newLeads?: number;
};

export function AdminShell({ children, newLeads }: AdminShellProps) {
  const t = useTranslations('AdminShell');
  const tNav = useTranslations('AdminNav');
  const tDemo = useTranslations('Admin.demo');
  const tLayout = useTranslations('Layout');
  const locale = useLocale();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { session } = useAdminSession();
  const logout = useLogout();
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const menuOpen = openedAt === pathname;
  const { mutateAsync } = logout;

  const openMenu = useCallback(() => setOpenedAt(pathname), [pathname]);
  const closeMenu = useCallback(() => setOpenedAt(null), []);

  const signOut = useCallback(async () => {
    try {
      await mutateAsync();
    } catch {
      return;
    }
    queryClient.clear();
    window.location.replace(getPathname({ href: '/admin/login', locale }));
  }, [locale, mutateAsync, queryClient]);

  const me = session.status === 'authenticated' ? session.me : null;
  const resetAt = me?.isDemo ? me.sandbox?.nextResetAt : undefined;

  return (
    <div className={styles.root}>
      {resetAt ? (
        <DemoBanner resetAt={resetAt} label={tDemo('banner')} />
      ) : null}
      <header className={styles.header}>
        <IconButton
          icon="menu"
          label={tNav('menu')}
          className={styles.menuButton}
          aria-haspopup="dialog"
          onClick={openMenu}
        />
        <Link
          href="/admin"
          className={styles.brand}
          aria-label={t('brandLink')}
        >
          <Brand name={tLayout('brandName')} caption={t('caption')} />
        </Link>
        <div className={styles.tools}>
          <PreferenceSwitches withCurrency={false} />
          <Button kind="outline" loading={logout.isPending} onClick={signOut}>
            {tNav('logout')}
          </Button>
        </div>
      </header>
      {logout.isError ? (
        <p role="alert" className={styles.error}>
          {t('logoutFailed')}
        </p>
      ) : null}
      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <AdminNavigation newLeads={newLeads} />
        </aside>
        <div className={styles.main}>{children}</div>
      </div>
      <SidePanel
        open={menuOpen}
        onClose={closeMenu}
        title={tNav('menu')}
        closeLabel={tNav('closeMenu')}
      >
        <AdminNavigation newLeads={newLeads} />
      </SidePanel>
    </div>
  );
}
