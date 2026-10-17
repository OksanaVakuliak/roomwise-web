'use client';

import {
  type ComponentProps,
  type KeyboardEvent,
  type MouseEvent,
  useCallback,
} from 'react';
import { mergeControl } from '@/lib/form';
import { FormField } from '../FormField/FormField';
import { Icon } from '../Icon/Icon';
import styles from './Select.module.css';

export type SelectProps = Omit<ComponentProps<'select'>, 'children'> & {
  label: string;
  placeholder?: string;
  hint?: string;
  error?: string;
  loading?: boolean;
  loadingLabel?: string;
  children: ComponentProps<'select'>['children'];
};

export function Select({
  label,
  placeholder,
  hint,
  error,
  loading,
  loadingLabel,
  required,
  id,
  className,
  disabled,
  defaultValue,
  value,
  children,
  onMouseDown,
  onKeyDown,
  ...rest
}: SelectProps) {
  const initial =
    value === undefined && defaultValue === undefined && placeholder
      ? ''
      : defaultValue;

  const handleMouseDown = useCallback(
    (event: MouseEvent<HTMLSelectElement>) => {
      if (loading) {
        event.preventDefault();
      }
      onMouseDown?.(event);
    },
    [loading, onMouseDown],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLSelectElement>) => {
      if (loading && event.key !== 'Tab') {
        event.preventDefault();
      }
      onKeyDown?.(event);
    },
    [loading, onKeyDown],
  );

  return (
    <FormField
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      loading={loading}
      loadingLabel={loadingLabel}
      className={className}
    >
      {(control) => (
        <span className={styles.wrap}>
          <select
            {...rest}
            {...mergeControl(control, rest)}
            value={value}
            defaultValue={initial}
            disabled={disabled}
            aria-disabled={loading ? true : undefined}
            onMouseDown={handleMouseDown}
            onKeyDown={handleKeyDown}
            className={styles.control}
          >
            {placeholder ? (
              <option value="" disabled>
                {placeholder}
              </option>
            ) : null}
            {children}
          </select>
          <Icon name="chevronDown" className={styles.chevron} />
        </span>
      )}
    </FormField>
  );
}
