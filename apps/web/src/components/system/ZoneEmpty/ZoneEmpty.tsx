import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { EmptyState, type IconName } from '@/components/ui';
import type { ZoneKind } from '../ZoneSkeleton/ZoneSkeleton';

export type ZoneEmptyProps = {
  kind: ZoneKind;
  action?: ReactNode;
  headingLevel?: 2 | 3 | 4;
};

const ICONS: Record<ZoneKind, IconName> = {
  showcase: 'info',
  rooms: 'plus',
  specification: 'edit',
  estimate: 'info',
};

export function ZoneEmpty({ kind, action, headingLevel }: ZoneEmptyProps) {
  const t = useTranslations('ZoneStates.empty');

  return (
    <EmptyState
      icon={ICONS[kind]}
      title={t(`${kind}.title`)}
      text={t(`${kind}.text`)}
      action={action}
      headingLevel={headingLevel}
    />
  );
}
