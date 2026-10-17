import type { ComponentProps } from 'react';
import { Link as LocaleLink } from '@/i18n/navigation';
import styles from './Link.module.css';

export type LinkProps = ComponentProps<typeof LocaleLink>;

export function Link({ className, ...rest }: LinkProps) {
  const classes = [styles.root, className].filter(Boolean).join(' ');

  return <LocaleLink {...rest} className={classes} />;
}
