import type { ReactNode } from 'react';
import { Icon, type IconName } from '../Icon/Icon';
import styles from './EmptyState.module.css';

export type EmptyStateProps = {
  icon?: IconName;
  title: ReactNode;
  text?: ReactNode;
  action?: ReactNode;
  headingLevel?: 2 | 3 | 4;
};

export function EmptyState({
  icon,
  title,
  text,
  action,
  headingLevel = 3,
}: EmptyStateProps) {
  const Heading = `h${headingLevel}` as const;

  return (
    <div className={styles.root}>
      {icon ? (
        <span className={styles.icon}>
          <Icon name={icon} size="lg" />
        </span>
      ) : null}
      <Heading className={styles.title}>{title}</Heading>
      {text ? <p className={styles.text}>{text}</p> : null}
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
