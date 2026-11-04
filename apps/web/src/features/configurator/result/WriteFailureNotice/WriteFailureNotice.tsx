'use client';

import { useTranslations } from 'next-intl';
import { Banner, Link } from '@/components/ui';
import { STEP_PATHS } from '@/config/routes';

export type WriteFailureReason =
  | 'incomplete'
  | 'outOfBounds'
  | 'unknownReference'
  | 'styleMissing'
  | 'resave'
  | 'notFound'
  | 'generic';

export type WriteFailureNamespace = 'SaveCalculation.failure' | 'Lead.failure';

type FailureLink = { href: string; label: string };

export type WriteFailureNoticeProps = {
  namespace: WriteFailureNamespace;
  reason: WriteFailureReason;
};

export function WriteFailureNotice({
  namespace,
  reason,
}: WriteFailureNoticeProps) {
  const t = useTranslations(namespace);
  const links: Partial<Record<WriteFailureReason, FailureLink>> = {
    incomplete: { href: STEP_PATHS.object, label: t('incompleteLink') },
    outOfBounds: { href: STEP_PATHS.object, label: t('outOfBoundsLink') },
    styleMissing: { href: STEP_PATHS.style, label: t('styleMissingLink') },
  };
  const link = links[reason];

  return (
    <Banner
      variant={reason === 'resave' ? 'info' : 'error'}
      action={link ? <Link href={link.href}>{link.label}</Link> : undefined}
    >
      {t(reason)}
    </Banner>
  );
}
