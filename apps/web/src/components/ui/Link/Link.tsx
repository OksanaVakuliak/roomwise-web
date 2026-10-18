import type { ComponentProps } from 'react';
import { Link as LocaleLink } from '@/i18n/navigation';
import { cx } from '@/lib/cx';
import styles from './Link.module.css';

export type LinkProps = ComponentProps<typeof LocaleLink>;

export function Link({ className, ...rest }: LinkProps) {
  const classes = cx(styles.root, className);

  return <LocaleLink {...rest} className={classes} />;
}
