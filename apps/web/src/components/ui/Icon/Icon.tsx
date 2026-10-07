import styles from './Icon.module.css';
import { icons } from './icons';

export type IconName = keyof typeof icons;

export type IconProps = {
  name: IconName;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

export function Icon({ name, label, size = 'md', className }: IconProps) {
  const Component = icons[name];
  const classes = [styles.root, styles[size], className]
    .filter(Boolean)
    .join(' ');

  if (label) {
    return <Component className={classes} role="img" aria-label={label} />;
  }
  return <Component className={classes} aria-hidden="true" focusable="false" />;
}
