import { type ComponentProps, useId } from 'react';
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
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  const classes = [styles.root, className].filter(Boolean).join(' ');

  return (
    <label className={classes}>
      <input
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
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
