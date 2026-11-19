'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button, SceneToolbar, type SceneToolbarAction } from '@/components/ui';
import styles from './SceneToolbarSection.module.css';

const noop = () => undefined;

export function SceneToolbarSection() {
  const t = useTranslations('ShowcaseSceneToolbar');
  const room = useTranslations('RoomPreview');
  const [topView, setTopView] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const viewActions: SceneToolbarAction[] = [
    { id: 'reset', label: room('reset'), icon: 'resetView', onClick: noop },
    {
      id: 'top',
      label: room('top'),
      icon: 'topView',
      onClick: () => setTopView((value) => !value),
      pressed: topView,
    },
    {
      id: 'expand',
      label: expanded ? room('collapse') : room('expand'),
      icon: expanded ? 'collapse' : 'expand',
      onClick: () => setExpanded((value) => !value),
    },
  ];

  const disabledActions: SceneToolbarAction[] = [
    {
      id: 'reset',
      label: room('reset'),
      icon: 'resetView',
      onClick: noop,
      disabled: true,
    },
    {
      id: 'top',
      label: room('top'),
      icon: 'topView',
      onClick: noop,
      disabled: true,
    },
  ];

  const fallbackActions: SceneToolbarAction[] = [
    {
      id: 'expand',
      label: room('expand'),
      icon: 'expand',
      onClick: noop,
    },
  ];

  return (
    <>
      <p>{t('intro')}</p>

      <h3>{t('activeHeading')}</h3>
      <p>{t('activeCaption')}</p>
      <div className={styles.group}>
        <SceneToolbar actions={viewActions}>
          <Button onClick={noop}>{room('disable')}</Button>
        </SceneToolbar>
      </div>

      <h3>{t('loadingHeading')}</h3>
      <p>{t('loadingCaption')}</p>
      <div className={styles.group}>
        <SceneToolbar actions={disabledActions} />
      </div>

      <h3>{t('fallbackHeading')}</h3>
      <p>{t('fallbackCaption')}</p>
      <div className={styles.group}>
        <SceneToolbar actions={fallbackActions}>
          <Button onClick={noop}>{room('enable')}</Button>
        </SceneToolbar>
      </div>
    </>
  );
}
