import type { AriaAttributes } from 'react';
import type { FieldControlProps } from '@/components/ui';

export type MergedControlProps = Omit<FieldControlProps, 'aria-invalid'> & {
  'aria-invalid'?: AriaAttributes['aria-invalid'];
};

export function mergeDescribedBy(
  ...ids: (string | undefined)[]
): string | undefined {
  const unique = new Set(
    ids.flatMap((value) => (value ? value.split(/\s+/) : [])).filter(Boolean),
  );
  return unique.size ? [...unique].join(' ') : undefined;
}

export function mergeControl(
  control: FieldControlProps,
  consumer: AriaAttributes,
  ...extraIds: (string | undefined)[]
): MergedControlProps {
  return {
    ...control,
    'aria-describedby': mergeDescribedBy(
      consumer['aria-describedby'],
      control['aria-describedby'],
      ...extraIds,
    ),
    'aria-invalid': control['aria-invalid'] ?? consumer['aria-invalid'],
  };
}
