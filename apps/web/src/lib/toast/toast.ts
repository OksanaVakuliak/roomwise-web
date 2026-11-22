import { create } from 'zustand';

export type ToastVariant = 'info' | 'success' | 'error';

export type ToastItem = {
  id: string;
  variant: ToastVariant;
  message: string;
  duration?: number;
};

type ToastState = {
  items: ToastItem[];
};

export const MAX_VISIBLE_TOASTS = 3;
const AUTO_DISMISS_MS = 5000;

export const useToasts = create<ToastState>()(() => ({ items: [] }));

let sequence = 0;

function push(variant: ToastVariant, message: string): string {
  sequence += 1;
  const id = `toast-${sequence}`;
  const item: ToastItem =
    variant === 'error'
      ? { id, variant, message }
      : { id, variant, message, duration: AUTO_DISMISS_MS };
  useToasts.setState((state) => ({
    items: [...state.items, item].slice(-MAX_VISIBLE_TOASTS),
  }));
  return id;
}

function dismiss(id: string): void {
  useToasts.setState((state) => ({
    items: state.items.filter((item) => item.id !== id),
  }));
}

export function resetToasts(): void {
  useToasts.setState({ items: [] });
}

export const toast = {
  success: (message: string) => push('success', message),
  error: (message: string) => push('error', message),
  info: (message: string) => push('info', message),
  dismiss,
};
