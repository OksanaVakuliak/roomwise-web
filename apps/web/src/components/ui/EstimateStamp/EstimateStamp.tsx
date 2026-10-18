'use client';

import {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { Icon } from '../Icon/Icon';
import { StackBar } from '../StackBar/StackBar';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden';
import styles from './EstimateStamp.module.css';

export type EstimateStampPart = {
  key: string;
  label: ReactNode;
  value: ReactNode;
  share: number;
};

export type EstimateStampProps = {
  totalLabel: ReactNode;
  total: string;
  parts: readonly EstimateStampPart[];
  barLabel: string;
  toggleLabel: string;
  announcement?: string;
  actions?: ReactNode;
  defaultExpanded?: boolean;
  className?: string;
};

export function EstimateStamp({
  totalLabel,
  total,
  parts,
  barLabel,
  toggleLabel,
  announcement,
  actions,
  defaultExpanded = false,
  className,
}: EstimateStampProps) {
  const panelId = useId();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [message, setMessage] = useState('');
  const previousTotal = useRef(total);

  useEffect(() => {
    if (previousTotal.current === total) {
      return;
    }
    previousTotal.current = total;
    setMessage('');
    const frame = requestAnimationFrame(() =>
      setMessage(announcement ?? total),
    );
    return () => cancelAnimationFrame(frame);
  }, [total, announcement]);

  const toggle = useCallback(() => setExpanded((value) => !value), []);
  const classes = [styles.root, expanded ? styles.expanded : styles.collapsed]
    .concat(className ?? [])
    .join(' ');

  return (
    <div className={classes}>
      <div className={styles.total}>
        <span className={styles.totalLabel}>{totalLabel}</span>
        <b className={`${styles.totalValue} num`}>{total}</b>
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={toggle}
        >
          <span className={styles.toggleText}>{toggleLabel}</span>
          <Icon name="chevronDown" size="sm" className={styles.chevron} />
        </button>
      </div>
      <StackBar
        className={styles.bar}
        label={barLabel}
        segments={parts.map(({ key, share }) => ({ key, share }))}
      />
      <dl id={panelId} className={styles.parts}>
        {parts.map((part) => (
          <div key={part.key} className={styles.part}>
            <dt>{part.label}</dt>
            <dd className={`${styles.partValue} num`}>{part.value}</dd>
          </div>
        ))}
      </dl>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
      <span role="status">
        <VisuallyHidden>{message}</VisuallyHidden>
      </span>
    </div>
  );
}
