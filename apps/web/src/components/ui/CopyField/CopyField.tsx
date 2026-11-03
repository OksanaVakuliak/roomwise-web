'use client';

import { type ComponentProps, useCallback, useRef, useState } from 'react';
import { cx } from '@/lib/cx';
import { mergeControl } from '@/lib/form';
import { Button } from '../Button/Button';
import { FormField } from '../FormField/FormField';
import { Icon } from '../Icon/Icon';
import styles from './CopyField.module.css';

export type CopyFieldProps = Omit<
  ComponentProps<'input'>,
  'children' | 'type' | 'value' | 'defaultValue' | 'readOnly' | 'onChange'
> & {
  label: string;
  value: string;
  copyLabel: string;
  copiedLabel: string;
  fallbackLabel: string;
  hint?: string;
};

type CopyStatus = 'idle' | 'copied' | 'manual';

function copyBySelection(input: HTMLInputElement | null) {
  if (!input) {
    return false;
  }
  input.focus();
  input.select();
  try {
    return document.execCommand('copy');
  } catch {
    return false;
  }
}

export function CopyField({
  label,
  value,
  copyLabel,
  copiedLabel,
  fallbackLabel,
  hint,
  id,
  className,
  ...rest
}: CopyFieldProps) {
  const [status, setStatus] = useState<CopyStatus>('idle');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setStatus('copied');
      return;
    } catch {
      setStatus(copyBySelection(inputRef.current) ? 'copied' : 'manual');
    }
  }, [value]);

  const handleFocus = useCallback(() => {
    inputRef.current?.select();
  }, []);

  return (
    <div className={cx(styles.root, className)}>
      <FormField id={id} label={label} hint={hint}>
        {(control) => (
          <span className={styles.row}>
            <input
              {...rest}
              {...mergeControl(control, rest)}
              ref={inputRef}
              type="text"
              value={value}
              readOnly
              onFocus={handleFocus}
              className={styles.control}
            />
            <Button kind="fill" onClick={handleCopy} className={styles.button}>
              <Icon name={status === 'copied' ? 'check' : 'copy'} />
              {copyLabel}
            </Button>
          </span>
        )}
      </FormField>
      <p role="status" className={styles.status} data-status={status}>
        {status === 'copied' ? copiedLabel : null}
        {status === 'manual' ? fallbackLabel : null}
      </p>
    </div>
  );
}
