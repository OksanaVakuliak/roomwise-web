import type { AriaAttributes } from 'react';

export type FieldControlProps = {
  id: string;
  'aria-describedby'?: string;
  'aria-invalid'?: true;
  'aria-busy'?: true;
  required?: true;
};

export type MergedControlProps = Omit<
  FieldControlProps,
  'aria-invalid' | 'aria-busy'
> & {
  'aria-invalid'?: AriaAttributes['aria-invalid'];
  'aria-busy'?: AriaAttributes['aria-busy'];
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
    id: control.id,
    ...(control.required ? { required: control.required } : {}),
    'aria-busy': control['aria-busy'] ?? consumer['aria-busy'],
    'aria-describedby': mergeDescribedBy(
      consumer['aria-describedby'],
      control['aria-describedby'],
      ...extraIds,
    ),
    'aria-invalid': control['aria-invalid'] ?? consumer['aria-invalid'],
  };
}
