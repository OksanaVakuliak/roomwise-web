import type { ButtonHTMLAttributes } from 'react';
import { Icon, type IconName } from '../Icon/Icon';
import styles from './IconButton.module.css';

export type IconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'aria-label'
> & {
  icon: IconName;
  label: string;
};

export function IconButton({
  icon,
  label,
  type = 'button',
  className,
  ...rest
}: IconButtonProps) {
  const classes = [styles.root, className].filter(Boolean).join(' ');

  return (
    <button {...rest} type={type} className={classes} aria-label={label}>
      <Icon name={icon} size="lg" />
    </button>
  );
}
