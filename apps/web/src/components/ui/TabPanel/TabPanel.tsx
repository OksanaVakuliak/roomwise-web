import type { HTMLAttributes } from 'react';
import { cx } from '@/lib/cx';
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
      className={cx(styles.root, className)}
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
