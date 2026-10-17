import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden';
import styles from './RevisionMark.module.css';

export type RevisionMarkProps = {
  number: number;
  size?: 'mobile' | 'desktop';
  label?: string;
};

export function RevisionMark({
  number,
  size = 'mobile',
  label,
}: RevisionMarkProps) {
  return (
    <span className={`${styles.root} ${styles[size]}`}>
      <span aria-hidden="true">{number}</span>
      {label ? <VisuallyHidden>{label}</VisuallyHidden> : null}
    </span>
  );
}
