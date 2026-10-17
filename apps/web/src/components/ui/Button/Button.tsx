import type { ButtonHTMLAttributes, MouseEvent } from 'react';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden';
import styles from './Button.module.css';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  kind?: 'outline' | 'fill' | 'heat';
  loading?: boolean;
  loadingLabel?: string;
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
  const classes = [styles.root, styles[kind], className]
    .filter(Boolean)
    .join(' ');

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
