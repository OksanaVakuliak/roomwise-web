'use client';

import { useTranslations } from 'next-intl';
import { Banner, Link } from '@/components/ui';
import { calculationPath } from '@/config/routes';
import type { VersionView } from '@/lib/api/calculations';

export type NewerVersionLinkProps = {
  version: VersionView;
};

export function NewerVersionLink({ version }: NewerVersionLinkProps) {
  const t = useTranslations('CalculationPage.newer');
  const newest = version.versions[0];

  if (!newest || newest.number <= version.number) {
    return null;
  }

  return (
    <Banner
      variant="info"
      action={
        <Link href={calculationPath(version.publicId, newest.number)}>
          {t('link', { number: newest.number })}
        </Link>
      }
    >
      {t('text')}
    </Banner>
  );
}
