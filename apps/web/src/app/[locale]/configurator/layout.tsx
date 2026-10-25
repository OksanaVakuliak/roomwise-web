import type { ReactNode } from 'react';
import { WarmupGate } from '@/components/system';

export default function ConfiguratorLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <WarmupGate>{children}</WarmupGate>;
}
