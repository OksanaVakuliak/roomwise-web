import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AdminSessionProvider } from '@/features/admin/session';
import { AdminToasts } from '@/features/admin/toasts/AdminToasts';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminSessionProvider>
      {children}
      <AdminToasts />
    </AdminSessionProvider>
  );
}
