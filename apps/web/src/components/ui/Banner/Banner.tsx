import type { ReactNode } from 'react';
import { Icon, type IconName } from '../Icon/Icon';
import { IconButton } from '../IconButton/IconButton';
import styles from './Banner.module.css';

export type BannerVariant = 'info' | 'warning' | 'error' | 'success';

export type BannerProps = {
  variant?: BannerVariant;
  title?: ReactNode;
  children: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
  dismissLabel?: string;
};

const icons: Record<BannerVariant, IconName> = {
  info: 'info',
  warning: 'warning',
  error: 'warning',
  success: 'check',
};

export function Banner({
  variant = 'info',
  title,
  children,
  action,
  onDismiss,
  dismissLabel,
}: BannerProps) {
  return (
    <div
      className={`${styles.root} ${styles[variant]}`}
      role={variant === 'error' ? 'alert' : 'status'}
    >
      <span className={styles.icon}>
        <Icon name={icons[variant]} size="lg" />
      </span>
      <div className={styles.body}>
        {title ? <p className={styles.title}>{title}</p> : null}
        <p className={styles.text}>{children}</p>
        {action ? <div className={styles.action}>{action}</div> : null}
      </div>
      {onDismiss && dismissLabel ? (
        <IconButton icon="close" label={dismissLabel} onClick={onDismiss} />
      ) : null}
    </div>
  );
}
