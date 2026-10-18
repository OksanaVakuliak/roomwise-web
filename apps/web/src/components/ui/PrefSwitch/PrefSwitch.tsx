'use client';

import { type MouseEvent, type ReactNode, useCallback } from 'react';
import { cx } from '@/lib/cx';
import styles from './PrefSwitch.module.css';

export type PrefSwitchOption = {
  value: string;
  content: ReactNode;
  label?: string;
};

export type PrefSwitchProps = {
  label: string;
  options: readonly [PrefSwitchOption, PrefSwitchOption, PrefSwitchOption?];
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function PrefSwitch({
  label,
  options,
  value,
  onChange,
  className,
}: PrefSwitchProps) {
  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const next = event.currentTarget.dataset.value;
      if (next !== undefined) onChange(next);
    },
    [onChange],
  );
  const classes = cx(styles.root, className);

  return (
    <div role="group" aria-label={label} className={classes}>
      {options.map((option) =>
        option ? (
          <button
            key={option.value}
            type="button"
            className={styles.item}
            aria-label={option.label}
            aria-pressed={option.value === value}
            data-value={option.value}
            onClick={handleClick}
          >
            {option.content}
          </button>
        ) : null,
      )}
    </div>
  );
}
