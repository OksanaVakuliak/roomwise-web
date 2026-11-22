'use client';

import { type ChangeEvent, useCallback, useState } from 'react';
import { mergeControl } from '@/lib/form';
import { FormField } from '../FormField/FormField';
import styles from './ColorField.module.css';

export type ColorFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  pickerLabel: string;
  invalidMessage: string;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
};

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export function ColorField({
  label,
  value,
  onChange,
  pickerLabel,
  invalidMessage,
  hint,
  error,
  required,
  disabled,
  id,
  name,
  className,
}: ColorFieldProps) {
  const [text, setText] = useState(value);
  const [seen, setSeen] = useState(value);
  if (value !== seen) {
    setSeen(value);
    if (text.toLowerCase() !== value.toLowerCase()) {
      setText(value);
    }
  }

  const valid = HEX_COLOR.test(text);
  const message = error ?? (valid ? undefined : invalidMessage);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const next = event.target.value;
      setText(next);
      if (HEX_COLOR.test(next)) {
        onChange(next.toLowerCase());
      }
    },
    [onChange],
  );

  return (
    <FormField
      id={id}
      label={label}
      hint={hint}
      error={message}
      required={required}
      className={className}
    >
      {(control) => (
        <span className={styles.wrap}>
          <input
            type="color"
            aria-label={pickerLabel}
            value={valid ? text.toLowerCase() : value}
            disabled={disabled}
            className={styles.picker}
            onChange={handleChange}
          />
          <input
            {...mergeControl(control, {})}
            type="text"
            name={name}
            value={text}
            disabled={disabled}
            autoComplete="off"
            spellCheck={false}
            maxLength={7}
            className={styles.control}
            onChange={handleChange}
          />
        </span>
      )}
    </FormField>
  );
}
