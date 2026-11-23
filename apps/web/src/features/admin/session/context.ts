'use client';

import { createContext, useContext } from 'react';
import type { AdminMe } from '@/lib/admin-api/auth';

export type AdminSession =
  | { status: 'checking' }
  | { status: 'anonymous' }
  | { status: 'error'; retry: () => Promise<unknown> }
  | { status: 'authenticated'; me: AdminMe };

export type AdminSessionValue = {
  session: AdminSession;
  reauthing: boolean;
  requestReauth: () => Promise<void>;
  withReauth: <T>(run: () => Promise<T>) => Promise<T>;
};

export const AdminSessionContext = createContext<AdminSessionValue | null>(
  null,
);

export function useAdminSession(): AdminSessionValue {
  const value = useContext(AdminSessionContext);
  if (!value) {
    throw new Error('useAdminSession needs AdminSessionProvider');
  }
  return value;
}
