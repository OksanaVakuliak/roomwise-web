import type { ReactNode } from 'react';
import { WarmupGate } from '@/components/system';

export default function CalculationsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <WarmupGate>{children}</WarmupGate>;
}
