import type { ReactNode } from 'react';
import { WarmupGate } from '@/components/system';
import styles from './layout.module.css';

export default function CalculationsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <WarmupGate>
      <div className={styles.root}>{children}</div>
    </WarmupGate>
  );
}
