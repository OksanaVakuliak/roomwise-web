'use client';

import {
  type ChangeEvent,
  type ComponentProps,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { cx } from '@/lib/cx';
import { Icon } from '../Icon/Icon';
import { TextField } from '../TextField/TextField';
import styles from './SearchField.module.css';

const SEARCH_DELAY_MS = 300;

export type SearchFieldProps = Omit<
  ComponentProps<typeof TextField>,
  'type' | 'value' | 'loading' | 'loadingLabel' | 'ref'
> & {
  clearLabel: string;
  onSearch?: (value: string) => void;
};

export function SearchField({
  clearLabel,
  onSearch,
  onChange,
  defaultValue,
  className,
  ...rest
}: SearchFieldProps) {
  const [value, setValue] = useState(String(defaultValue ?? ''));
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const input = useRef<HTMLInputElement>(null);
  const latest = useRef(onSearch);
  latest.current = onSearch;

  useEffect(() => () => clearTimeout(timer.current), []);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const next = event.target.value;
      setValue(next);
      onChange?.(event);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => latest.current?.(next), SEARCH_DELAY_MS);
    },
    [onChange],
  );

  const handleClear = useCallback(() => {
    clearTimeout(timer.current);
    setValue('');
    latest.current?.('');
    input.current?.focus();
  }, []);

  return (
    <div className={cx(styles.root, className)}>
      <TextField
        {...rest}
        ref={input}
        type="search"
        value={value}
        onChange={handleChange}
        className={styles.field}
      />
      {value ? (
        <button
          type="button"
          className={styles.clear}
          aria-label={clearLabel}
          onClick={handleClear}
        >
          <Icon name="close" size="md" />
        </button>
      ) : null}
    </div>
  );
}
