import { type ReactNode, useId } from 'react';
import type { FieldControlProps } from '@/lib/form';
import { Icon } from '../Icon/Icon';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden';
import styles from './FormField.module.css';

export type { FieldControlProps } from '@/lib/form';

export type FormFieldProps = {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  id?: string;
  group?: boolean;
  className?: string;
  children: (control: FieldControlProps) => ReactNode;
};

export type FieldMessagesProps = {
  id: string;
  hint?: string;
  error?: string;
};

export function FieldMessages({ id, hint, error }: FieldMessagesProps) {
  return (
    <>
      {hint ? (
        <p id={`${id}-hint`} className={styles.hint}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className={styles.error}>
          <Icon name="warning" size="sm" />
          {error}
        </p>
      ) : null}
    </>
  );
}

export function FormField({
  label,
  hint,
  error,
  required,
  loading,
  loadingLabel,
  id: idProp,
  group,
  className,
  children,
}: FormFieldProps) {
  const generated = useId();
  const id = idProp ?? generated;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  const classes = [styles.root, error ? styles.invalid : '', className]
    .filter(Boolean)
    .join(' ');

  const control: FieldControlProps = {
    id,
    'aria-describedby': describedBy,
    'aria-invalid': error ? true : undefined,
    'aria-busy': loading ? true : undefined,
    required: required ? true : undefined,
  };

  const caption = (
    <>
      {label}
      {required ? (
        <span className={styles.required} aria-hidden="true">
          *
        </span>
      ) : null}
      {loading ? (
        <>
          <span className={styles.spinner} aria-hidden="true" />
          {loadingLabel ? (
            <VisuallyHidden>{loadingLabel}</VisuallyHidden>
          ) : null}
        </>
      ) : null}
    </>
  );

  const messages = <FieldMessages id={id} hint={hint} error={error} />;

  if (group) {
    return (
      <fieldset
        className={classes}
        aria-describedby={describedBy}
        aria-busy={loading ? true : undefined}
      >
        <legend className={styles.label}>{caption}</legend>
        {messages}
        {children(control)}
      </fieldset>
    );
  }

  return (
    <div className={classes}>
      <label htmlFor={id} className={styles.label}>
        {caption}
      </label>
      {children(control)}
      {messages}
    </div>
  );
}
