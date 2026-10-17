'use client';

import {
  type ChangeEvent,
  type ComponentProps,
  useCallback,
  useState,
} from 'react';
import { FormField } from '../FormField/FormField';
import { Icon } from '../Icon/Icon';
import styles from './FileField.module.css';

export type FileFieldProps = Omit<
  ComponentProps<'input'>,
  'children' | 'type' | 'value' | 'defaultValue'
> & {
  label: string;
  buttonLabel: string;
  emptyLabel: string;
  fileName?: string;
  hint?: string;
  error?: string;
  loading?: boolean;
  loadingLabel?: string;
};

export function FileField({
  label,
  buttonLabel,
  emptyLabel,
  fileName,
  hint,
  error,
  loading,
  loadingLabel,
  required,
  id,
  className,
  disabled,
  onChange,
  ...rest
}: FileFieldProps) {
  const [chosen, setChosen] = useState('');
  const name = fileName ?? chosen;

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setChosen(
        Array.from(event.target.files ?? [], (file) => file.name).join(', '),
      );
      onChange?.(event);
    },
    [onChange],
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
        <span className={styles.root}>
          <input
            {...rest}
            {...control}
            type="file"
            disabled={disabled || loading}
            className={styles.input}
            onChange={handleChange}
          />
          <span
            className={styles.face}
            data-invalid={error ? true : undefined}
            data-busy={loading ? true : undefined}
          >
            <span className={styles.button}>
              <Icon name="upload" />
              {buttonLabel}
            </span>
            <span className={styles.name}>{name || emptyLabel}</span>
          </span>
        </span>
      )}
    </FormField>
  );
}
