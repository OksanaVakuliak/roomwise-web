'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import { Button, SceneToolbar, type SceneToolbarAction } from '@/components/ui';
import styles from './SceneToolbarSection.module.css';

const noop = () => undefined;

export function SceneToolbarSection() {
  const t = useTranslations('ShowcaseSceneToolbar');
  const [topView, setTopView] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [scene3d, setScene3d] = useState(true);

  const disable3d = useCallback(() => setScene3d(false), []);
  const enable3d = useCallback(() => setScene3d(true), []);

  const viewActions: SceneToolbarAction[] = [
    { id: 'reset', label: t('reset'), icon: 'resetView', onClick: noop },
    {
      id: 'top',
      label: t('top'),
      icon: 'topView',
      onClick: () => setTopView((value) => !value),
      pressed: topView,
    },
    {
      id: 'expand',
      label: expanded ? t('collapse') : t('expand'),
      icon: expanded ? 'collapse' : 'expand',
      onClick: () => setExpanded((value) => !value),
    },
  ];

  const disabledActions: SceneToolbarAction[] = [
    {
      id: 'reset',
      label: t('reset'),
      icon: 'resetView',
      onClick: noop,
      disabled: true,
    },
    {
      id: 'top',
      label: t('top'),
      icon: 'topView',
      onClick: noop,
      disabled: true,
    },
  ];

  const fallbackActions: SceneToolbarAction[] = [
    {
      id: 'expand',
      label: t('expand'),
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
          <Button onClick={disable3d}>{t('disable')}</Button>
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
          <Button onClick={enable3d}>{t('enable')}</Button>
        </SceneToolbar>
        <p>{scene3d ? t('stateOn') : t('stateOff')}</p>
      </div>
    </>
  );
}
