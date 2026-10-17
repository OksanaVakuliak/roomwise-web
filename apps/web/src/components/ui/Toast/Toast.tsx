'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Icon, type IconName } from '../Icon/Icon';
import { IconButton } from '../IconButton/IconButton';
import styles from './Toast.module.css';

export type ToastVariant = 'info' | 'success' | 'error';

export type ToastProps = {
  children: ReactNode;
  dismissLabel: string;
  onDismiss: () => void;
  variant?: ToastVariant;
  duration?: number;
};

const ICONS: Record<ToastVariant, IconName> = {
  info: 'info',
  success: 'check',
  error: 'warning',
};

export function Toast({
  children,
  dismissLabel,
  onDismiss,
  variant = 'info',
  duration,
}: ToastProps) {
  const [announced, setAnnounced] = useState(false);
  const dismissRef = useRef(onDismiss);

  useEffect(() => {
    dismissRef.current = onDismiss;
  });

  useEffect(() => {
    setAnnounced(true);
  }, []);

  useEffect(() => {
    if (duration === undefined) {
      return;
    }
    const timer = setTimeout(() => dismissRef.current(), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`${styles.root} ${styles[variant]}`}
    >
      <Icon name={ICONS[variant]} size="lg" className={styles.icon} />
      <p className={styles.text}>{announced ? children : null}</p>
      <IconButton icon="close" label={dismissLabel} onClick={onDismiss} />
    </div>
  );
}
