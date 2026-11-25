'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAdminMe } from '@/lib/admin-api/auth';
import { toAdminError } from '@/lib/admin-api/errors';
import { adminKeys } from '@/lib/admin-api/keys';
import {
  type AdminSession,
  AdminSessionContext,
  type AdminSessionValue,
} from './context';
import { ReauthDialog } from './ReauthDialog';

type Waiter = { resolve: () => void; reject: () => void };

export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const query = useAdminMe();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [declined, setDeclined] = useState(false);
  const waiters = useRef<Waiter[]>([]);
  const { refetch, dataUpdatedAt } = query;

  useEffect(() => {
    if (dataUpdatedAt > 0) setDeclined(false);
  }, [dataUpdatedAt]);

  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        void refetch();
      }
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, [refetch]);

  const settle = useCallback(
    (outcome: 'resolve' | 'reject') => {
      const pending = waiters.current;
      waiters.current = [];
      setOpen(false);
      if (outcome === 'reject') {
        setDeclined(true);
      } else {
        void queryClient.invalidateQueries({
          queryKey: adminKeys.all(),
          predicate: (cached) => cached.queryKey[1] !== 'me',
        });
      }
      for (const waiter of pending) {
        waiter[outcome]();
      }
    },
    [queryClient],
  );

  const requestReauth = useCallback(
    () =>
      new Promise<void>((resolve, reject) => {
        waiters.current.push({ resolve, reject });
        setOpen(true);
      }),
    [],
  );

  const withReauth = useCallback(
    async <T,>(run: () => Promise<T>): Promise<T> => {
      try {
        return await run();
      } catch (failure) {
        if (toAdminError(failure).kind !== 'unauthenticated') {
          throw failure;
        }
        try {
          await requestReauth();
        } catch {
          throw failure;
        }
        return run();
      }
    },
    [requestReauth],
  );

  const { data, isPending, isError, error } = query;
  const session = useMemo<AdminSession>(() => {
    if (
      isError &&
      toAdminError(error).kind === 'unauthenticated' &&
      !(data && !declined)
    ) {
      return { status: 'anonymous' };
    }
    if (data) return { status: 'authenticated', me: data };
    if (isPending) return { status: 'checking' };
    if (isError) return { status: 'error', retry: refetch };
    return { status: 'anonymous' };
  }, [data, isPending, isError, error, refetch, declined]);

  const onSuccess = useCallback(() => settle('resolve'), [settle]);
  const onCancel = useCallback(() => settle('reject'), [settle]);

  const value = useMemo<AdminSessionValue>(
    () => ({
      session,
      reauthing: open,
      declined,
      requestReauth,
      withReauth,
    }),
    [session, open, declined, requestReauth, withReauth],
  );

  return (
    <AdminSessionContext value={value}>
      {children}
      <ReauthDialog open={open} onSuccess={onSuccess} onCancel={onCancel} />
    </AdminSessionContext>
  );
}
