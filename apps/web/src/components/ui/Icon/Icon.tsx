import { cx } from '@/lib/cx';
import styles from './Icon.module.css';
import { icons } from './icons';

export type IconName = keyof typeof icons;

export const iconNames = Object.keys(icons) as IconName[];

export type IconProps = {
  name: IconName;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

export function Icon({ name, label, size = 'md', className }: IconProps) {
  const Component = icons[name];
  const classes = cx(styles.root, styles[size], className);

  if (label) {
    return <Component className={classes} role="img" aria-label={label} />;
  }
  return <Component className={classes} aria-hidden="true" focusable="false" />;
}
