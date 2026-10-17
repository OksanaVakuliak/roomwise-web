'use client';

import {
  Children,
  createContext,
  isValidElement,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useContext,
  useId,
  useMemo,
} from 'react';
import styles from './Tabs.module.css';

export type TabsSize = 'mobile' | 'desktop';

type TabsContextValue = {
  id: string;
  value: string;
  focusValue: string | undefined;
  size: TabsSize;
  onValueChange: (value: string) => void;
};

const TabsContext = createContext<TabsContextValue | null>(null);

export function useTabsContext(): TabsContextValue {
  const context = useContext(TabsContext);
  if (!context) throw new Error('Tab must be rendered inside Tabs');
  return context;
}

export function tabId(tabsId: string, value: string): string {
  return `${tabsId}-tab-${value}`;
}

export function panelId(tabsId: string, value: string): string {
  return `${tabsId}-panel-${value}`;
}

export type TabsProps = {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  size?: TabsSize;
  id?: string;
  className?: string;
  children: ReactNode;
};

export function Tabs({
  label,
  value,
  onValueChange,
  size = 'mobile',
  id,
  className,
  children,
}: TabsProps) {
  const values = Children.toArray(children).flatMap((child) =>
    isValidElement<{ value?: unknown }>(child) &&
    typeof child.props.value === 'string'
      ? [child.props.value]
      : [],
  );
  const focusValue = values.includes(value) ? value : values[0];
  const generatedId = useId();
  const tabsId = id ?? generatedId;
  const classes = [styles.root, styles[size], className]
    .filter(Boolean)
    .join(' ');

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const tabs = Array.from(
        event.currentTarget.querySelectorAll<HTMLElement>(
          '[role="tab"]:not(:disabled)',
        ),
      );
      const current = tabs.findIndex((tab) => tab === document.activeElement);
      if (current === -1) return;

      let next: number;
      if (event.key === 'ArrowRight') next = (current + 1) % tabs.length;
      else if (event.key === 'ArrowLeft')
        next = (current - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;

      event.preventDefault();
      const target = tabs[next];
      target.focus();
      const nextValue = target.dataset.value;
      if (nextValue !== undefined) onValueChange(nextValue);
    },
    [onValueChange],
  );

  const context = useMemo(
    () => ({ id: tabsId, value, focusValue, size, onValueChange }),
    [tabsId, value, focusValue, size, onValueChange],
  );

  return (
    <TabsContext.Provider value={context}>
      <div
        role="tablist"
        aria-label={label}
        aria-orientation="horizontal"
        className={classes}
        onKeyDown={handleKeyDown}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
}
