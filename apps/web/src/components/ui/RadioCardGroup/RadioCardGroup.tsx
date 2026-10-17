'use client';

import type { ReactNode } from 'react';
import { RadioCardGroupContext } from '@/lib/form';
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
  const state = { required: rest.required, invalid: Boolean(rest.error) };

  return (
    <FormField {...rest} className={className} group>
      {() => (
        <RadioCardGroupContext value={state}>
          <div className={styles.cards}>{children}</div>
        </RadioCardGroupContext>
      )}
    </FormField>
  );
}
