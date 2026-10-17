import { type ComponentProps, useId } from 'react';
import { mergeControl } from '@/lib/form';
import { FormField } from '../FormField/FormField';
import styles from './NumberField.module.css';

export type NumberFieldProps = Omit<
  ComponentProps<'input'>,
  'children' | 'type'
> & {
  label: string;
  unit?: string;
  hint?: string;
  error?: string;
  loading?: boolean;
  loadingLabel?: string;
};

export function NumberField({
  label,
  unit,
  hint,
  error,
  loading,
  loadingLabel,
  required,
  id,
  className,
  readOnly,
  inputMode = 'decimal',
  ...rest
}: NumberFieldProps) {
  const unitId = useId();

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
          <input
            {...rest}
            {...mergeControl(control, rest, unit ? unitId : undefined)}
            type="number"
            inputMode={inputMode}
            readOnly={loading || readOnly}
            className={`${styles.control} num`}
          />
          {unit ? (
            <span id={unitId} className={styles.unit}>
              {unit}
            </span>
          ) : null}
        </span>
      )}
    </FormField>
  );
}
