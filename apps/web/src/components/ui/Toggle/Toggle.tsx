'use client';

import { type ButtonHTMLAttributes, useCallback } from 'react';
import { cx } from '@/lib/cx';
import styles from './Toggle.module.css';

type ToggleOwnProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

type ToggleName =
  | { label: string; 'aria-labelledby'?: undefined }
  | { label?: undefined; 'aria-labelledby': string };

export type ToggleProps = ToggleOwnProps &
  ToggleName &
  Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'onClick' | 'role' | 'aria-checked' | 'aria-label' | 'aria-labelledby'
  >;

export function Toggle({
  checked,
  onCheckedChange,
  label,
  className,
  type = 'button',
  ...rest
}: ToggleProps) {
  const handleClick = useCallback(
    () => onCheckedChange(!checked),
    [onCheckedChange, checked],
  );
  const classes = cx(styles.root, checked ? styles.on : styles.off, className);

  return (
    <button
      {...rest}
      type={type}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={classes}
      onClick={handleClick}
    >
      <span className={styles.knob} />
    </button>
  );
}
