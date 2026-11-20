import { Skeleton } from '@/components/ui';
import { LEAD_FIELDS, type LeadField } from '../lead-fields';
import styles from './LeadFormSkeleton.module.css';

type FieldShape = { kind: 'input' | 'textarea' | 'checkbox'; hint: boolean };

const SHAPES: Record<LeadField, FieldShape> = {
  name: { kind: 'input', hint: false },
  phone: { kind: 'input', hint: true },
  email: { kind: 'input', hint: true },
  comment: { kind: 'textarea', hint: true },
  consent: { kind: 'checkbox', hint: false },
};

const CONTROL_HEIGHT = {
  input: 'var(--size-target)',
  textarea: 'calc(var(--size-target) * 2)',
} as const;

export function LeadFormSkeleton() {
  return (
    <div className={styles.root} aria-hidden="true">
      {LEAD_FIELDS.map((field) => {
        const { kind, hint } = SHAPES[field];
        if (kind === 'checkbox') {
          return (
            <div key={field} className={styles.checkbox}>
              <Skeleton
                variant="block"
                width="var(--icon-lg)"
                height="var(--icon-lg)"
              />
              <Skeleton width="60%" />
            </div>
          );
        }
        return (
          <div key={field} className={styles.field}>
            <Skeleton width="30%" />
            <Skeleton variant="block" height={CONTROL_HEIGHT[kind]} />
            <div className={styles.messages}>
              {hint ? <Skeleton width="50%" /> : null}
            </div>
          </div>
        );
      })}
      <Skeleton variant="block" width="40%" height="var(--size-button)" />
    </div>
  );
}
