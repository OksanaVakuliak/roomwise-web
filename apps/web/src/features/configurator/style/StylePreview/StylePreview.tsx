'use client';

import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { Button, ImageWithFallback, Modal } from '@/components/ui';
import styles from './StylePreview.module.css';

export type StylePreviewStyle = {
  id: string;
  name: string;
  description: string;
  image: { zoom: string } | null;
};

export type StylePreviewProps = {
  item: StylePreviewStyle | null;
  selected: boolean;
  onSelect: (styleId: string) => void;
  onClose: () => void;
};

export function StylePreview({
  item,
  selected,
  onSelect,
  onClose,
}: StylePreviewProps) {
  const t = useTranslations('StyleStep');
  const styleId = item?.id;
  const handleSelect = useCallback(() => {
    if (styleId) {
      onSelect(styleId);
    }
  }, [onSelect, styleId]);

  return (
    <Modal
      open={item !== null}
      onClose={onClose}
      title={item?.name ?? ''}
      closeLabel={t('previewClose')}
    >
      {item ? (
        <>
          <span className={styles.image}>
            <ImageWithFallback src={item.image?.zoom} name={item.name} />
          </span>
          <p className={styles.description}>{item.description}</p>
          <div className={styles.actions}>
            <Button kind="fill" disabled={selected} onClick={handleSelect}>
              {selected ? t('previewSelected') : t('previewSelect')}
            </Button>
          </div>
        </>
      ) : null}
    </Modal>
  );
}
