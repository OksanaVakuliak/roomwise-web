'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Banner, CopyField } from '@/components/ui';
import { calculationPath } from '@/config/routes';
import { getPathname } from '@/i18n/navigation';
import styles from './SavedLink.module.css';

export type SavedLinkProps = { publicId: string; versionNumber: number };

export function SavedLink({ publicId, versionNumber }: SavedLinkProps) {
  const t = useTranslations('SavedLink');
  const locale = useLocale();
  const path = getPathname({
    href: calculationPath(publicId, versionNumber),
    locale,
  });
  const url = new URL(path, window.location.origin).href;

  return (
    <div className={styles.root}>
      <Banner variant="success" title={t('title')}>
        {t('text')}
      </Banner>
      <CopyField
        label={t('label')}
        value={url}
        copyLabel={t('copy')}
        copiedLabel={t('copied')}
        fallbackLabel={t('fallback')}
      />
    </div>
  );
}
