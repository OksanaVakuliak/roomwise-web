'use client';

import { type ComponentProps, use, useId } from 'react';
import { cx } from '@/lib/cx';
import { RadioCardGroupContext } from '@/lib/form';
import styles from './RadioCard.module.css';

export type RadioCardProps = Omit<
  ComponentProps<'input'>,
  'children' | 'type'
> & {
  label: string;
  description?: string;
};

export function RadioCard({
  label,
  description,
  className,
  ...rest
}: RadioCardProps) {
  const group = use(RadioCardGroupContext);
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  const classes = cx(styles.root, className);

  return (
    <label className={classes}>
      <input
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        required={group.required || undefined}
        aria-invalid={group.invalid || undefined}
        {...rest}
        type="radio"
        className={styles.input}
      />
      <span className={styles.face}>
        <span className={styles.mark} aria-hidden="true" />
        <span className={styles.text}>
          <span id={titleId} className={styles.title}>
            {label}
          </span>
          {description ? (
            <span id={descriptionId} className={styles.description}>
              {description}
            </span>
          ) : null}
        </span>
      </span>
    </label>
  );
}
