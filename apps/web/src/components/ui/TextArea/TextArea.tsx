import type { ComponentProps } from 'react';
import { mergeControl } from '@/lib/form';
import { FormField } from '../FormField/FormField';
import styles from './TextArea.module.css';

export type TextAreaProps = Omit<ComponentProps<'textarea'>, 'children'> & {
  label: string;
  hint?: string;
  error?: string;
  loading?: boolean;
  loadingLabel?: string;
};

export function TextArea({
  label,
  hint,
  error,
  loading,
  loadingLabel,
  required,
  id,
  className,
  rows = 4,
  readOnly,
  ...rest
}: TextAreaProps) {
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
        <textarea
          {...rest}
          {...mergeControl(control, rest)}
          rows={rows}
          readOnly={loading || readOnly}
          className={styles.control}
        />
      )}
    </FormField>
  );
}
