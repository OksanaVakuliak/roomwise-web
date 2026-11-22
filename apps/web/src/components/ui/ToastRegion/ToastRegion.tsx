import { useCallback } from 'react';
import { Toast, type ToastVariant } from '../Toast/Toast';
import styles from './ToastRegion.module.css';

export type ToastRegionItem = {
  id: string;
  variant: ToastVariant;
  message: string;
  duration?: number;
};

export type ToastRegionProps = {
  toasts: readonly ToastRegionItem[];
  onDismiss: (id: string) => void;
  label: string;
  dismissLabel: string;
};

type RegionToastProps = {
  item: ToastRegionItem;
  dismissLabel: string;
  onDismiss: (id: string) => void;
};

function RegionToast({ item, dismissLabel, onDismiss }: RegionToastProps) {
  const handleDismiss = useCallback(
    () => onDismiss(item.id),
    [onDismiss, item.id],
  );
  return (
    <Toast
      variant={item.variant}
      duration={item.duration}
      dismissLabel={dismissLabel}
      onDismiss={handleDismiss}
    >
      {item.message}
    </Toast>
  );
}

export function ToastRegion({
  toasts,
  onDismiss,
  label,
  dismissLabel,
}: ToastRegionProps) {
  return (
    <section className={styles.root} aria-label={label}>
      {toasts.map((item) => (
        <RegionToast
          key={item.id}
          item={item}
          dismissLabel={dismissLabel}
          onDismiss={onDismiss}
        />
      ))}
    </section>
  );
}
