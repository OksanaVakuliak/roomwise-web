'use client';

import { type ReactNode, useId } from 'react';
import { Tab, TabPanel, Tabs } from '@/components/ui';
import styles from './RoomSwitcher.module.css';

export type RoomSwitcherItem = {
  clientId: string;
  label: string;
};

export type RoomSwitcherProps = {
  label: string;
  items: readonly RoomSwitcherItem[];
  value: string;
  onValueChange: (clientId: string) => void;
  children?: ReactNode;
};

export function RoomSwitcher({
  label,
  items,
  value,
  onValueChange,
  children,
}: RoomSwitcherProps) {
  const tabsId = useId();

  return (
    <div className={styles.root}>
      <Tabs
        id={tabsId}
        label={label}
        value={value}
        onValueChange={onValueChange}
      >
        {items.map((item) => (
          <Tab key={item.clientId} value={item.clientId}>
            {item.label}
          </Tab>
        ))}
      </Tabs>
      <TabPanel tabsId={tabsId} value={value} selected className={styles.panel}>
        {children}
      </TabPanel>
    </div>
  );
}
