import type { ButtonHTMLAttributes } from 'react';
import { cx } from '@/lib/cx';
import { Icon } from '../Icon/Icon';
import styles from './DisclosureButton.module.css';

export type DisclosureButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'aria-label' | 'aria-expanded' | 'aria-controls'
> & {
  expanded: boolean;
  controls: string;
  label: string;
};

export function DisclosureButton({
  expanded,
  controls,
  label,
  type = 'button',
  className,
  ...rest
}: DisclosureButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      className={cx(styles.root, expanded && styles.expanded, className)}
      aria-label={label}
      aria-expanded={expanded}
      aria-controls={controls}
    >
      <Icon name="chevronDown" size="md" />
    </button>
  );
}
