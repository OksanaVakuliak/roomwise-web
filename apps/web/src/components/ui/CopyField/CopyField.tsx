'use client';

import {
  type ComponentProps,
  type FocusEvent,
  useCallback,
  useId,
  useRef,
  useState,
} from 'react';
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
type CopyResult = { status: CopyStatus; value: string };

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
  onFocus,
  ...rest
}: CopyFieldProps) {
  const [result, setResult] = useState<CopyResult>({
    status: 'idle',
    value,
  });
  const statusId = useId();
  const status = result.value === value ? result.status : 'idle';
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setResult({ status: 'copied', value });
    } catch {
      const copied = copyBySelection(inputRef.current);
      setResult({ status: copied ? 'copied' : 'manual', value });
    }
  }, [value]);

  const handleFocus = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      onFocus?.(event);
      event.currentTarget.select();
    },
    [onFocus],
  );

  return (
    <div className={cx(styles.root, className)}>
      <FormField id={id} label={label} hint={hint}>
        {(control) => (
          <span className={styles.row}>
            <input
              {...rest}
              {...mergeControl(control, rest, statusId)}
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
      <p
        id={statusId}
        role="status"
        className={styles.status}
        data-status={status}
      >
        {status === 'copied' ? copiedLabel : null}
        {status === 'manual' ? fallbackLabel : null}
      </p>
    </div>
  );
}
