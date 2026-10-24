import type { ComponentProps } from 'react';
import { mergeControl } from '@/lib/form';
import { FormField } from '../FormField/FormField';
import styles from './TextField.module.css';

export type TextFieldProps = Omit<ComponentProps<'input'>, 'children'> & {
  label: string;
  hint?: string;
  error?: string;
  loading?: boolean;
  loadingLabel?: string;
};

export function TextField({
  label,
  hint,
  error,
  loading,
  loadingLabel,
  required,
  id,
  className,
  type = 'text',
  readOnly,
  ...rest
}: TextFieldProps) {
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
        <input
          {...rest}
          {...mergeControl(control, rest)}
          type={type}
          readOnly={loading || readOnly}
          className={styles.control}
        />
      )}
    </FormField>
  );
}
