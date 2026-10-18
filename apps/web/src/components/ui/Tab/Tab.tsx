'use client';

import { type ButtonHTMLAttributes, type MouseEvent, useCallback } from 'react';
import { cx } from '@/lib/cx';
import { panelId, tabId, useTabsContext } from '../Tabs/Tabs';
import styles from './Tab.module.css';

export type TabProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'role' | 'id' | 'value' | 'aria-selected' | 'aria-controls' | 'tabIndex'
> & {
  value: string;
};

export function Tab({
  value,
  className,
  children,
  onClick,
  type = 'button',
  ...rest
}: TabProps) {
  const tabs = useTabsContext();
  const selected = tabs.value === value;
  const { onValueChange } = tabs;
  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      onValueChange(value);
    },
    [onClick, onValueChange, value],
  );
  const classes = cx(
    styles.root,
    styles[tabs.size],
    selected && styles.selected,
    className,
  );

  return (
    <button
      {...rest}
      type={type}
      role="tab"
      id={tabId(tabs.id, value)}
      aria-selected={selected}
      aria-controls={panelId(tabs.id, value)}
      tabIndex={tabs.focusValue === value ? 0 : -1}
      data-value={value}
      className={classes}
      onClick={handleClick}
    >
      {children}
    </button>
  );
}
