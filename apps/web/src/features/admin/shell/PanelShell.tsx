'use client';

import type { ReactNode } from 'react';
import { useNewLeadsCount } from '@/lib/admin-api/leads';
import { AdminShell } from './AdminShell/AdminShell';

export function PanelShell({ children }: { children: ReactNode }) {
  const { data } = useNewLeadsCount();
  return <AdminShell newLeads={data}>{children}</AdminShell>;
}
