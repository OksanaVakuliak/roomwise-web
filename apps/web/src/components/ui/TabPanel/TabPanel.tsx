import type { HTMLAttributes } from 'react';
import { panelId, tabId } from '../Tabs/Tabs';
import styles from './TabPanel.module.css';

export type TabPanelProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'role' | 'id' | 'aria-labelledby'
> & {
  tabsId: string;
  value: string;
  selected: boolean;
};

export function TabPanel({
  tabsId,
  value,
  selected,
  className,
  children,
  ...rest
}: TabPanelProps) {
  return (
    <div
      {...rest}
      className={[styles.root, className].filter(Boolean).join(' ')}
      role="tabpanel"
      id={panelId(tabsId, value)}
      aria-labelledby={tabId(tabsId, value)}
      hidden={!selected}
      tabIndex={0}
    >
      {children}
    </div>
  );
}
