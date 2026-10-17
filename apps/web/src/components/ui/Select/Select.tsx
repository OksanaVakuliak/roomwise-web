import type { ComponentProps } from 'react';
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
  ...rest
}: SelectProps) {
  const initial =
    value === undefined && defaultValue === undefined && placeholder
      ? ''
      : defaultValue;

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
            {...control}
            value={value}
            defaultValue={initial}
            disabled={disabled || loading}
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
