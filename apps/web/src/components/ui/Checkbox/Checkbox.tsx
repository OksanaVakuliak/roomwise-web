import { type ComponentProps, useId } from 'react';
import { FieldMessages } from '../FormField/FormField';
import { Icon } from '../Icon/Icon';
import styles from './Checkbox.module.css';

export type CheckboxProps = Omit<
  ComponentProps<'input'>,
  'children' | 'type'
> & {
  label: string;
  hint?: string;
  error?: string;
};

export function Checkbox({
  label,
  hint,
  error,
  id: idProp,
  className,
  ...rest
}: CheckboxProps) {
  const generated = useId();
  const id = idProp ?? generated;
  const describedBy =
    [hint ? `${id}-hint` : '', error ? `${id}-error` : '']
      .filter(Boolean)
      .join(' ') || undefined;
  const classes = [styles.root, error ? styles.invalid : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <label htmlFor={id} className={styles.row}>
        <input
          {...rest}
          id={id}
          type="checkbox"
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={styles.input}
        />
        <span className={styles.box} aria-hidden="true">
          <Icon name="check" size="sm" className={styles.check} />
        </span>
        <span className={styles.text}>{label}</span>
      </label>
      <div className={styles.messages}>
        <FieldMessages id={id} hint={hint} error={error} />
      </div>
    </div>
  );
}
