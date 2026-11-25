'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { type ReactNode, useEffect, useRef } from 'react';
import { ErrorState } from '@/components/system';
import { Skeleton, VisuallyHidden } from '@/components/ui';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useAdminMe } from '@/lib/admin-api/auth';
import { toAdminError } from '@/lib/admin-api/errors';
import { adminKeys } from '@/lib/admin-api/keys';
import { useAdminSession } from './context';

export function AdminSessionGate({ children }: { children: ReactNode }) {
  const { session, reauthing, requestReauth } = useAdminSession();
  const t = useTranslations('Admin.session');
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const me = useAdminMe();
  const redirected = useRef(false);
  const recovering = useRef(false);

  const anonymous = session.status === 'anonymous';
  const hadSession = me.data != null;

  useEffect(() => {
    const leave = () => {
      if (redirected.current) return;
      redirected.current = true;
      queryClient.removeQueries({
        queryKey: adminKeys.all(),
        predicate: (query) => query.queryKey[1] !== 'me',
      });
      queryClient.setQueryData(adminKeys.me(), null);
      const next = `${pathname}${window.location.search}`;
      router.replace(`/admin/login?next=${encodeURIComponent(next)}`);
    };
    const recover = () => {
      if (recovering.current || redirected.current) return;
      recovering.current = true;
      requestReauth()
        .then(() => {
          recovering.current = false;
          void queryClient.invalidateQueries({ queryKey: adminKeys.all() });
        })
        .catch(() => {
          recovering.current = false;
          leave();
        });
    };
    const onUnauthenticated = () => {
      if (queryClient.getQueryData(adminKeys.me())) recover();
      else leave();
    };
    if (reauthing) return;
    if (anonymous) onUnauthenticated();
    return queryClient.getQueryCache().subscribe((event) => {
      if (
        event.type === 'updated' &&
        event.action.type === 'error' &&
        event.query.queryKey[0] === 'admin' &&
        toAdminError(event.action.error).kind === 'unauthenticated'
      ) {
        onUnauthenticated();
      }
    });
  }, [anonymous, pathname, queryClient, reauthing, requestReauth, router]);

  if (session.status === 'checking') {
    return (
      <div role="status">
        <VisuallyHidden>{t('checking')}</VisuallyHidden>
        <Skeleton variant="block" height="3rem" />
        <Skeleton variant="block" height="12rem" />
      </div>
    );
  }
  if (session.status === 'error') {
    return <ErrorState headingLevel={2} onRetry={session.retry} />;
  }
  if (anonymous && !hadSession) {
    return null;
  }
  return children;
}
