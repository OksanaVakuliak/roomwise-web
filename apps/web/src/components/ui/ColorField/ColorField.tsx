'use client';

import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { mergeControl } from '@/lib/form';
import { FormField } from '../FormField/FormField';
import styles from './ColorField.module.css';

export type ColorFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onValidityChange?: (valid: boolean) => void;
  pickerLabel: string;
  invalidMessage: string;
  resetKey?: string | number;
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
  onValidityChange,
  pickerLabel,
  invalidMessage,
  resetKey,
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
  const [seenKey, setSeenKey] = useState(resetKey);
  const [edited, setEdited] = useState(false);
  if (resetKey !== seenKey) {
    setSeenKey(resetKey);
    setSeen(value);
    setText(value);
    setEdited(false);
  } else if (value !== seen) {
    setSeen(value);
    if (text.toLowerCase() !== value.toLowerCase()) {
      setText(value);
    }
  }

  const valid = HEX_COLOR.test(text) || (!required && text === '');
  const reported = useRef(true);
  useEffect(() => {
    if (valid !== reported.current) {
      reported.current = valid;
      onValidityChange?.(valid);
    }
  }, [valid, onValidityChange]);
  const message = error ?? (edited && !valid ? invalidMessage : undefined);
  const pickerValue = HEX_COLOR.test(text)
    ? text.toLowerCase()
    : HEX_COLOR.test(value)
      ? value.toLowerCase()
      : '#000000';

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const next = event.target.value;
      setText(next);
      setEdited(true);
      if (HEX_COLOR.test(next)) {
        onChange(next.toLowerCase());
      } else if (next === '' && !required) {
        onChange('');
      }
    },
    [onChange, required],
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
            value={pickerValue}
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
