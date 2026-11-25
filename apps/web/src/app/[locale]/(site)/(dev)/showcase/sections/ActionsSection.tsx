'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useId, useState } from 'react';
import {
  Button,
  IconButton,
  Link,
  SwitchRow,
  Tab,
  TabPanel,
  Tabs,
  Toggle,
} from '@/components/ui';
import { SizeFrame } from '../DesktopFrame';
import styles from './ActionsSection.module.css';

const KINDS = ['outline', 'fill', 'heat'] as const;
const TABS = ['walls', 'floor', 'ceiling'] as const;

function TabsDemo({ size }: { size: 'mobile' | 'desktop' }) {
  const t = useTranslations('ShowcaseActions');
  const id = useId();
  const [value, setValue] = useState<(typeof TABS)[number]>('walls');

  const handleValueChange = useCallback(
    (next: string) => setValue(next as (typeof TABS)[number]),
    [],
  );

  return (
    <div>
      <Tabs
        id={id}
        label={t('tabsLabel')}
        size={size}
        value={value}
        onValueChange={handleValueChange}
      >
        {TABS.map((tab) => (
          <Tab key={tab} value={tab}>
            {t(tab)}
          </Tab>
        ))}
      </Tabs>
      {TABS.map((tab) => (
        <TabPanel key={tab} tabsId={id} value={tab} selected={value === tab}>
          {t(`${tab}Panel`)}
        </TabPanel>
      ))}
    </div>
  );
}

export function ActionsSection() {
  const t = useTranslations('ShowcaseActions');
  const [on, setOn] = useState(true);
  const [off, setOff] = useState(false);
  const [row, setRow] = useState(true);

  return (
    <>
      <h3 className={styles.title}>{t('buttonsTitle')}</h3>
      <p>{t('stateNote')}</p>
      {KINDS.map((kind) => (
        <p key={kind} className={styles.row}>
          <Button kind={kind}>
            {t(kind)}
            {kind === 'fill' ? <span className="num">{t('price')}</span> : null}
          </Button>
          <Button kind={kind} disabled>
            {t('disabled')}
          </Button>
          <Button kind={kind} loading loadingLabel={t('loadingLabel')}>
            {t('loading')}
          </Button>
        </p>
      ))}

      <h3 className={styles.title}>{t('iconButtonTitle')}</h3>
      <p className={styles.row}>
        <IconButton icon="close" label={t('iconClose')} />
        <IconButton icon="plus" label={t('iconAdd')} />
        <IconButton icon="edit" label={t('iconEdit')} />
        <IconButton icon="trash" label={t('iconDisabled')} disabled />
      </p>

      <h3 className={styles.title}>{t('linkTitle')}</h3>
      <p>
        <Link href="/">{t('link')}</Link>
      </p>

      <h3 className={styles.title}>{t('toggleTitle')}</h3>
      <p className={styles.row}>
        <Toggle label={t('toggleOn')} checked={on} onCheckedChange={setOn} />
        <Toggle label={t('toggleOff')} checked={off} onCheckedChange={setOff} />
      </p>

      <h3 className={styles.title}>{t('switchRowTitle')}</h3>
      <SwitchRow
        title={t('rowTitle')}
        description={t('rowDescription')}
        checked={row}
        onCheckedChange={setRow}
      />

      <h3 className={styles.title}>{t('tabsTitle')}</h3>
      <h4 className={styles.title}>{t('tabsMobile')}</h4>
      <TabsDemo size="mobile" />
      <h4 className={styles.title}>{t('tabsDesktop')}</h4>
      <SizeFrame size="desktop" label={t('tabsTitle')}>
        <TabsDemo size="desktop" />
      </SizeFrame>
    </>
  );
}
