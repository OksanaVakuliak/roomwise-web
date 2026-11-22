import type { ReactNode } from 'react';
import { WarmupGate } from '@/components/system';
import { AdminSessionGate } from '@/features/admin/session';
import { PanelShell } from '@/features/admin/shell';

export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <WarmupGate>
      <AdminSessionGate>
        <PanelShell>{children}</PanelShell>
      </AdminSessionGate>
    </WarmupGate>
  );
}
