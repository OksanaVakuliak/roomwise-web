import { cx } from '@/lib/cx';
import styles from './StatusBadge.module.css';

export type StatusBadgeStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'ARCHIVED'
  | 'NEW'
  | 'IN_PROGRESS'
  | 'DONE'
  | 'REJECTED'
  | 'SPAM';

export type StatusBadgeProps = {
  status: StatusBadgeStatus;
  label: string;
  className?: string;
};

const VARIANTS: Record<StatusBadgeStatus, string> = {
  DRAFT: styles.draft,
  PUBLISHED: styles.published,
  ARCHIVED: styles.archived,
  NEW: styles.new,
  IN_PROGRESS: styles.progress,
  DONE: styles.done,
  REJECTED: styles.rejected,
  SPAM: styles.spam,
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <span
      data-status={status}
      className={cx(styles.root, VARIANTS[status], className)}
    >
      {label}
    </span>
  );
}
