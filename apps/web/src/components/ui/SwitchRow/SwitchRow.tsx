'use client';

import { useId } from 'react';
import { Toggle } from '../Toggle/Toggle';
import styles from './SwitchRow.module.css';

export type SwitchRowProps = {
  title: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
};

export function SwitchRow({
  title,
  description,
  checked,
  onCheckedChange,
  disabled,
  className,
}: SwitchRowProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  const classes = [styles.root, className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <p className={styles.text}>
        <span id={titleId} className={styles.title}>
          {title}
        </span>
        {description ? (
          <span id={descriptionId} className={styles.description}>
            {description}
          </span>
        ) : null}
      </p>
      <Toggle
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
}
