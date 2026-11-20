import type { ButtonHTMLAttributes, MouseEvent, Ref } from 'react';
import { cx } from '@/lib/cx';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden';
import styles from './Button.module.css';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  kind?: 'outline' | 'fill' | 'heat';
  loading?: boolean;
  loadingLabel?: string;
  ref?: Ref<HTMLButtonElement>;
};

function preventAction(event: MouseEvent<HTMLButtonElement>) {
  event.preventDefault();
}

export function Button({
  kind = 'outline',
  loading = false,
  loadingLabel,
  type = 'button',
  className,
  children,
  onClick,
  disabled,
  ...rest
}: ButtonProps) {
  const classes = cx(styles.root, styles[kind], className);

  return (
    <button
      {...rest}
      type={type}
      className={classes}
      disabled={disabled}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      data-loading={loading || undefined}
      onClick={loading ? preventAction : onClick}
    >
      {loading ? (
        <>
          <span className={styles.spinner} aria-hidden="true" />
          {loadingLabel ? (
            <VisuallyHidden>{loadingLabel}</VisuallyHidden>
          ) : null}
        </>
      ) : null}
      {children}
    </button>
  );
}
