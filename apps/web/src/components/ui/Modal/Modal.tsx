'use client';

import { type ReactNode, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cx } from '@/lib/cx';
import { useDialog, useIsClient } from '@/lib/dialog';
import { IconButton } from '../IconButton/IconButton';
import styles from './Modal.module.css';

export type ModalPlacement = 'center' | 'bottom' | 'side';

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel: string;
  children: ReactNode;
  placement?: ModalPlacement;
  dismissOnBackdrop?: boolean;
  className?: string;
};

type DialogProps = Omit<ModalProps, 'open'>;

function Dialog({
  onClose,
  title,
  closeLabel,
  children,
  placement = 'center',
  dismissOnBackdrop = true,
  className,
}: DialogProps) {
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);
  useDialog(ref, onClose);

  return (
    <div className={cx(styles.root, styles[`${placement}Root`])}>
      <div
        className={styles.backdrop}
        onClick={dismissOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cx(styles.panel, styles[placement], className)}
      >
        <header className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <IconButton icon="close" label={closeLabel} onClick={onClose} />
        </header>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}

export function Modal({ open, ...rest }: ModalProps) {
  const isClient = useIsClient();

  if (!open || !isClient) {
    return null;
  }

  return createPortal(<Dialog {...rest} />, document.body);
}
