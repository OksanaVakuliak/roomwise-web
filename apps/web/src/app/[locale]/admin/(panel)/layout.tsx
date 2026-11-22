import type { ReactNode } from 'react';
import { AdminSessionGate } from '@/features/admin/session';
import { AdminShell } from '@/features/admin/shell';

export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <AdminSessionGate>
      <AdminShell>{children}</AdminShell>
    </AdminSessionGate>
  );
}
