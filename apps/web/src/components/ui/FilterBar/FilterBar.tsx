'use client';

import { type ReactNode, useCallback, useId, useState } from 'react';
import { cx } from '@/lib/cx';
import { Button } from '../Button/Button';
import { DisclosureButton } from '../DisclosureButton/DisclosureButton';
import styles from './FilterBar.module.css';

export type FilterBarProps = {
  children: ReactNode;
  onReset?: () => void;
  resetLabel: string;
  toggleLabel: string;
  className?: string;
};

export function FilterBar({
  children,
  onReset,
  resetLabel,
  toggleLabel,
  className,
}: FilterBarProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const toggle = useCallback(() => setOpen((value) => !value), []);

  return (
    <div className={cx(styles.root, className)}>
      <div className={styles.toggle}>
        <DisclosureButton
          expanded={open}
          controls={panelId}
          label={toggleLabel}
          onClick={toggle}
        />
        <span className={styles.toggleLabel} aria-hidden="true">
          {toggleLabel}
        </span>
      </div>
      <div
        id={panelId}
        className={styles.panel}
        data-open={open ? '' : undefined}
      >
        <div className={styles.filters}>{children}</div>
        {onReset ? (
          <Button kind="outline" onClick={onReset}>
            {resetLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
