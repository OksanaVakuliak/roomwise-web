import type { ReactNode } from 'react';
import { FormField } from '../FormField/FormField';
import styles from './RadioCardGroup.module.css';

export type RadioCardGroupProps = {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  id?: string;
  className?: string;
  children: ReactNode;
};

export function RadioCardGroup({
  children,
  className,
  ...rest
}: RadioCardGroupProps) {
  return (
    <FormField {...rest} className={className} group>
      {() => <div className={styles.cards}>{children}</div>}
    </FormField>
  );
}
