'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { type ReactNode, useEffect, useRef } from 'react';
import { Skeleton, VisuallyHidden } from '@/components/ui';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useAdminMe } from '@/lib/admin-api/auth';
import { toAdminError } from '@/lib/admin-api/errors';
import { adminKeys } from '@/lib/admin-api/keys';
import { useAdminSession } from './context';

export function AdminSessionGate({ children }: { children: ReactNode }) {
  const { session } = useAdminSession();
  const t = useTranslations('Admin.session');
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const me = useAdminMe();
  const redirected = useRef(false);

  const expired =
    me.isError && toAdminError(me.error).kind === 'unauthenticated';

  useEffect(() => {
    const redirect = () => {
      if (redirected.current) return;
      redirected.current = true;
      queryClient.setQueryData(adminKeys.me(), null);
      const next = `${pathname}${window.location.search}`;
      router.replace(`/admin/login?next=${encodeURIComponent(next)}`);
    };
    if (expired) redirect();
    return queryClient.getQueryCache().subscribe((event) => {
      if (
        event.type === 'updated' &&
        event.action.type === 'error' &&
        event.query.queryKey[0] === 'admin' &&
        toAdminError(event.action.error).kind === 'unauthenticated'
      ) {
        redirect();
      }
    });
  }, [expired, pathname, queryClient, router]);

  if (session.status === 'checking') {
    return (
      <div role="status">
        <VisuallyHidden>{t('checking')}</VisuallyHidden>
        <Skeleton variant="block" height="3rem" />
        <Skeleton variant="block" height="12rem" />
      </div>
    );
  }
  if (session.status === 'anonymous') {
    return null;
  }
  return children;
}
