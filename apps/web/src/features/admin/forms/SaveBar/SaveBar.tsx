'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui';
import styles from './SaveBar.module.css';

export type SaveBarPublication = {
  published: boolean;
  onToggle: () => void;
  disabled?: boolean;
};

export type SaveBarProps = {
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  publication?: SaveBarPublication;
  onArchive?: () => void;
  onDelete?: () => void;
};

export function SaveBar({
  dirty,
  saving,
  onSave,
  publication,
  onArchive,
  onDelete,
}: SaveBarProps) {
  const t = useTranslations('Admin.form');

  return (
    <div className={styles.root} role="group" aria-label={t('actions')}>
      <p className={styles.status} role="status">
        {dirty ? t('unsaved') : t('clean')}
      </p>
      <div className={styles.actions}>
        {onDelete ? (
          <Button kind="heat" disabled={saving} onClick={onDelete}>
            {t('delete')}
          </Button>
        ) : null}
        {onArchive ? (
          <Button kind="outline" disabled={saving} onClick={onArchive}>
            {t('archive')}
          </Button>
        ) : null}
        {publication ? (
          <Button
            kind="outline"
            disabled={saving || publication.disabled}
            onClick={publication.onToggle}
          >
            {publication.published ? t('unpublish') : t('publish')}
          </Button>
        ) : null}
        <Button
          kind="fill"
          loading={saving}
          loadingLabel={t('saving')}
          disabled={!dirty && !saving}
          onClick={onSave}
        >
          {t('save')}
        </Button>
      </div>
    </div>
  );
}
