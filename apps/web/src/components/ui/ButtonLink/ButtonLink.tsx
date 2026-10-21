import type { ComponentProps } from 'react';
import { Link } from '@/i18n/navigation';
import { cx } from '@/lib/cx';
import styles from './ButtonLink.module.css';

export type ButtonLinkProps = ComponentProps<typeof Link> & {
  kind?: 'outline' | 'fill' | 'heat';
};

export function ButtonLink({
  kind = 'fill',
  className,
  ...rest
}: ButtonLinkProps) {
  const classes = cx(styles.root, styles[kind], className);

  return <Link {...rest} className={classes} />;
}
