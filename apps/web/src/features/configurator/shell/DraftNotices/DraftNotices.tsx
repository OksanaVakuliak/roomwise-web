'use client';

import { useTranslations } from 'next-intl';
import { Banner } from '@/components/ui';
import { useDraft } from '@/stores/draft';
import styles from './DraftNotices.module.css';

export function DraftNotices() {
  const t = useTranslations('DraftNotices');
  const tShell = useTranslations('ConfiguratorShell');
  const storageAvailable = useDraft((state) => state.storageAvailable);
  const notice = useDraft((state) => state.notice);
  const dismissNotice = useDraft((state) => state.dismissNotice);

  if (storageAvailable && notice === null) {
    return null;
  }

  return (
    <div className={styles.root}>
      {storageAvailable ? null : (
        <Banner variant="warning">{t('storageUnavailable')}</Banner>
      )}
      {notice === 'draftReset' ? (
        <Banner
          variant="info"
          onDismiss={dismissNotice}
          dismissLabel={tShell('dismiss')}
        >
          {t('draftReset')}
        </Banner>
      ) : null}
    </div>
  );
}
