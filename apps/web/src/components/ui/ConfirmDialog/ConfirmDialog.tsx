'use client';

import { type ReactNode, useEffect, useRef } from 'react';
import { Button } from '../Button/Button';
import { Modal } from '../Modal/Modal';
import styles from './ConfirmDialog.module.css';

export type ConfirmDialogTone = 'default' | 'danger';

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  closeLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  tone?: ConfirmDialogTone;
};

type ContentProps = Pick<
  ConfirmDialogProps,
  | 'description'
  | 'confirmLabel'
  | 'cancelLabel'
  | 'onConfirm'
  | 'onCancel'
  | 'tone'
>;

function Content({
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  tone = 'default',
}: ContentProps) {
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    queueMicrotask(() => actionsRef.current?.querySelector('button')?.focus());
  }, []);

  return (
    <>
      <div className={styles.description}>{description}</div>
      <div ref={actionsRef} className={styles.actions}>
        <Button kind="outline" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button kind={tone === 'danger' ? 'heat' : 'fill'} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </>
  );
}

export function ConfirmDialog({
  open,
  title,
  closeLabel,
  onCancel,
  ...rest
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      closeLabel={closeLabel}
      dismissOnBackdrop={false}
    >
      <Content onCancel={onCancel} {...rest} />
    </Modal>
  );
}
