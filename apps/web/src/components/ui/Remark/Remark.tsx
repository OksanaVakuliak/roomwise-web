import type { ReactNode } from 'react';
import { cx } from '@/lib/cx';
import { RevisionMark } from '../RevisionMark/RevisionMark';
import styles from './Remark.module.css';

export type RemarkProps = {
  id?: string;
  number: number;
  size?: 'mobile' | 'desktop';
  title: ReactNode;
  text: ReactNode;
  suggestion: ReactNode;
  action?: ReactNode;
};

export function Remark({
  id,
  number,
  size = 'mobile',
  title,
  text,
  suggestion,
  action,
}: RemarkProps) {
  return (
    <div id={id} className={cx(styles.root, styles[size])}>
      <span className={styles.mark}>
        <RevisionMark number={number} size={size} />
      </span>
      <p className={styles.text}>
        <b>{title}</b> {text}
      </p>
      <div className={styles.fix}>
        <svg viewBox="0 0 40 34" aria-hidden="true" focusable="false">
          <path
            d="M4 4 C10 22 20 28 34 26 M34 26 l-9 -5 M34 26 l-7 6"
            fill="none"
            stroke="var(--pencil)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <p className={styles.hand}>{suggestion}</p>
        {action ? <div className={styles.action}>{action}</div> : null}
      </div>
    </div>
  );
}
