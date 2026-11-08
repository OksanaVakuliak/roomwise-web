'use client';

import {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { cx } from '@/lib/cx';
import { Icon } from '../Icon/Icon';
import { StackBar } from '../StackBar/StackBar';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden';
import styles from './EstimateStamp.module.css';

export type EstimateStampDetail = {
  key: string;
  label: ReactNode;
  value: ReactNode;
};

export type EstimateStampPart = {
  key: string;
  label: ReactNode;
  value: ReactNode;
  share: number;
  details?: readonly EstimateStampDetail[];
  detailsLabel?: string;
};

export type EstimateStampProps = {
  totalLabel: ReactNode;
  total: string;
  parts: readonly EstimateStampPart[];
  barLabel: string;
  toggleLabel: string;
  announcement?: string;
  note?: ReactNode;
  actions?: ReactNode;
  defaultExpanded?: boolean;
  className?: string;
};

function StampPart({ part }: { part: EstimateStampPart }) {
  const detailsId = useId();
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((value) => !value), []);
  const { details } = part;

  if (!details || details.length === 0) {
    return (
      <div className={styles.part}>
        <dt>{part.label}</dt>
        <dd className={`${styles.partValue} num`}>{part.value}</dd>
      </div>
    );
  }

  return (
    <div className={cx(styles.part, open && styles.partOpen)}>
      <dt>
        <button
          type="button"
          className={styles.partToggle}
          aria-expanded={open}
          aria-controls={detailsId}
          onClick={toggle}
        >
          {part.label}
          <Icon name="chevronDown" size="sm" className={styles.partChevron} />
        </button>
      </dt>
      <dd className={`${styles.partValue} num`}>{part.value}</dd>
      <dd id={detailsId} className={styles.details} hidden={!open}>
        <dl aria-label={part.detailsLabel} className={styles.detailList}>
          {details.map((detail) => (
            <div key={detail.key} className={styles.detail}>
              <dt>{detail.label}</dt>
              <dd className="num">{detail.value}</dd>
            </div>
          ))}
        </dl>
      </dd>
    </div>
  );
}

export function EstimateStamp({
  totalLabel,
  total,
  parts,
  barLabel,
  toggleLabel,
  announcement,
  note,
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
  const classes = cx(
    styles.root,
    expanded ? styles.expanded : styles.collapsed,
    className,
  );

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
      {note ? <p className={styles.note}>{note}</p> : null}
      <StackBar
        className={styles.bar}
        label={barLabel}
        segments={parts.map(({ key, share }) => ({ key, share }))}
      />
      <dl id={panelId} className={styles.parts}>
        {parts.map((part) => (
          <StampPart key={part.key} part={part} />
        ))}
      </dl>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
      <span role="status">
        <VisuallyHidden>{message}</VisuallyHidden>
      </span>
    </div>
  );
}
