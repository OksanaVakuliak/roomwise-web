'use client';

import { useTranslations } from 'next-intl';
import { type MouseEvent, useCallback, useState } from 'react';
import {
  BottomSheet,
  Button,
  Modal,
  SidePanel,
  Toast,
  type ToastVariant,
  Tooltip,
} from '@/components/ui';
import styles from './OverlaysSection.module.css';

const VARIANTS = ['info', 'success', 'error'] as const;
const OVERLAYS = ['modal', 'sheet', 'panel'] as const;

type Overlay = (typeof OVERLAYS)[number];

const COMPONENTS = {
  modal: Modal,
  sheet: BottomSheet,
  panel: SidePanel,
} as const;

const TOAST_TEXT = {
  info: 'toastInfoText',
  success: 'toastSuccessText',
  error: 'toastErrorText',
} as const;

const TOAST_BUTTON = {
  info: 'toastInfo',
  success: 'toastSuccess',
  error: 'toastError',
} as const;

const TOAST_DURATION = 6000;

function ToastItem({
  variant,
  text,
  dismissLabel,
  onDismiss,
}: {
  variant: ToastVariant;
  text: string;
  dismissLabel: string;
  onDismiss: (variant: ToastVariant) => void;
}) {
  const handleDismiss = useCallback(
    () => onDismiss(variant),
    [onDismiss, variant],
  );

  return (
    <Toast
      variant={variant}
      dismissLabel={dismissLabel}
      duration={TOAST_DURATION}
      onDismiss={handleDismiss}
    >
      {text}
    </Toast>
  );
}

export function OverlaysSection() {
  const t = useTranslations('ShowcaseOverlays');
  const [open, setOpen] = useState<Overlay | null>(null);
  const [toasts, setToasts] = useState<readonly ToastVariant[]>([]);
  const close = useCallback(() => setOpen(null), []);

  const handleOpen = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    setOpen(event.currentTarget.dataset.overlay as Overlay);
  }, []);

  const handleShow = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    const variant = event.currentTarget.dataset.variant as ToastVariant;
    setToasts((current) =>
      current.includes(variant) ? current : [...current, variant],
    );
  }, []);

  const dismiss = useCallback(
    (variant: ToastVariant) =>
      setToasts((current) => current.filter((item) => item !== variant)),
    [],
  );

  return (
    <>
      <h3 className={styles.title}>{t('modalTitle')}</h3>
      <p className={styles.row}>
        {OVERLAYS.map((overlay) => (
          <Button
            key={overlay}
            kind="outline"
            data-overlay={overlay}
            onClick={handleOpen}
          >
            {t(`${overlay}Button`)}
          </Button>
        ))}
      </p>
      {OVERLAYS.map((overlay) => {
        const Component = COMPONENTS[overlay];

        return (
          <Component
            key={overlay}
            open={open === overlay}
            onClose={close}
            title={t(`${overlay}Heading`)}
            closeLabel={t('closeLabel')}
          >
            <p>{t(`${overlay}Body`)}</p>
            <Button kind="fill" onClick={close}>
              {t('confirm')}
            </Button>
          </Component>
        );
      })}

      <h3 className={styles.title}>{t('tooltipTitle')}</h3>
      <p className={styles.row}>
        <Tooltip content={t('tooltipContent')}>
          <Button kind="outline">{t('tooltipButton')}</Button>
        </Tooltip>
      </p>

      <h3 className={styles.title}>{t('toastTitle')}</h3>
      <p className={styles.row}>
        {VARIANTS.map((variant) => (
          <Button
            key={variant}
            kind="outline"
            data-variant={variant}
            onClick={handleShow}
          >
            {t(TOAST_BUTTON[variant])}
          </Button>
        ))}
      </p>
      <div className={styles.toasts}>
        {toasts.map((variant) => (
          <ToastItem
            key={variant}
            variant={variant}
            text={t(TOAST_TEXT[variant])}
            dismissLabel={t('dismissLabel')}
            onDismiss={dismiss}
          />
        ))}
      </div>
    </>
  );
}
