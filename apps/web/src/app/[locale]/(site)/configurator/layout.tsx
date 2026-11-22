import type { ReactNode } from 'react';
import { WarmupGate } from '@/components/system';
import { ConfiguratorShell } from '@/features/configurator';

export default function ConfiguratorLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <WarmupGate>
      <ConfiguratorShell>{children}</ConfiguratorShell>
    </WarmupGate>
  );
}
