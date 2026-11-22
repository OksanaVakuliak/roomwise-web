import type { ReactNode } from 'react';
import { AdminSessionGate } from '@/features/admin/session';
import { PanelShell } from '@/features/admin/shell';

export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <AdminSessionGate>
      <PanelShell>{children}</PanelShell>
    </AdminSessionGate>
  );
}
