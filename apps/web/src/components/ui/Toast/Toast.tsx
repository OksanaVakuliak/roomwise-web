'use client';

import {
  type FocusEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { cx } from '@/lib/cx';
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
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const paused = hovered || focused;
  const dismissRef = useRef(onDismiss);

  useEffect(() => {
    dismissRef.current = onDismiss;
  });

  useEffect(() => {
    setAnnounced(true);
  }, []);

  useEffect(() => {
    if (duration === undefined || paused) {
      return;
    }
    const timer = setTimeout(() => dismissRef.current(), duration);
    return () => clearTimeout(timer);
  }, [duration, paused]);

  const handleEnter = useCallback(() => setHovered(true), []);
  const handleLeave = useCallback(() => setHovered(false), []);
  const handleFocus = useCallback(() => setFocused(true), []);
  const handleBlur = useCallback((event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setFocused(false);
    }
  }, []);

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cx(styles.root, styles[variant])}
      onPointerEnter={handleEnter}
      onPointerLeave={handleLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      <Icon name={ICONS[variant]} size="lg" className={styles.icon} />
      <p className={styles.text}>{announced ? children : null}</p>
      <IconButton icon="close" label={dismissLabel} onClick={onDismiss} />
    </div>
  );
}
