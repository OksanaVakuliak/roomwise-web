'use client';

import { createContext, type ReactNode, useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './NoticeStack.module.css';

const NoticeHostContext = createContext<HTMLElement | null>(null);

export function NoticeProvider({ children }: { children: ReactNode }) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  return (
    <NoticeHostContext value={host}>
      {children}
      <div ref={setHost} className={styles.root} />
    </NoticeHostContext>
  );
}

export function NoticeStack({ children }: { children: ReactNode }) {
  const host = useContext(NoticeHostContext);
  return host ? createPortal(children, host) : null;
}
