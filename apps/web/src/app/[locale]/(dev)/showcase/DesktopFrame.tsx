import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import styles from './DesktopFrame.module.css';

export function SizeFrame({
  size,
  label,
  children,
}: {
  size: 'mobile' | 'desktop';
  label: string;
  children: ReactNode;
}) {
  return size === 'desktop' ? (
    <DesktopFrame label={label}>{children}</DesktopFrame>
  ) : (
    children
  );
}

export function DesktopFrame({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const t = useTranslations('Showcase');

  return (
    <div
      className={styles.root}
      role="region"
      tabIndex={0}
      aria-label={t('desktopFrame', { name: label })}
    >
      <div className={styles.inner}>{children}</div>
    </div>
  );
}
