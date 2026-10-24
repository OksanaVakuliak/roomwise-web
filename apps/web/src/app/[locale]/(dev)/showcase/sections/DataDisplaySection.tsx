'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import {
  Banner,
  Button,
  DataTable,
  type DataTableColumn,
  EmptyState,
  ImageWithFallback,
  Progress,
  Skeleton,
} from '@/components/ui';
import { DesktopFrame } from '../DesktopFrame';
import styles from './DataDisplaySection.module.css';

type MaterialRow = {
  id: string;
  name: 'laminate' | 'vinyl' | 'tile';
  unit: string;
  price: string;
};

const ROWS: MaterialRow[] = [
  { id: '1.1', name: 'laminate', unit: 'm2', price: '14.20' },
  { id: '1.2', name: 'vinyl', unit: 'm2', price: '19.80' },
  { id: '1.3', name: 'tile', unit: 'm2', price: '22.50' },
];

const BANNERS = ['info', 'warning', 'error', 'success'] as const;

const SAMPLE_IMAGE =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><rect width='40' height='40' fill='%23b98a4e'/><path d='M0 10H40M0 20H40M0 30H40' stroke='%231d2a31' stroke-width='1.5'/></svg>";
const BROKEN_IMAGE = '/showcase-missing-image.png';

function SkeletonCard() {
  return (
    <div className={styles.card}>
      <Skeleton variant="circle" />
      <div className={styles.lines}>
        <Skeleton width="70%" />
        <Skeleton />
        <Skeleton width="40%" />
      </div>
      <div className={styles.wide}>
        <Skeleton variant="block" />
      </div>
    </div>
  );
}

function BannerList() {
  const t = useTranslations('ShowcaseDataDisplay');
  const [dismissed, setDismissed] = useState(false);
  const dismiss = useCallback(() => setDismissed(true), []);
  const restore = useCallback(() => setDismissed(false), []);

  return (
    <div className={styles.stack}>
      {BANNERS.map((variant) => (
        <Banner
          key={variant}
          variant={variant}
          title={t(`banner.${variant}Title`)}
          action={
            variant === 'warning' ? (
              <Button kind="outline">{t('banner.action')}</Button>
            ) : undefined
          }
        >
          {t(`banner.${variant}Text`)}
        </Banner>
      ))}
      {dismissed ? (
        <Button kind="outline" onClick={restore}>
          {t('banner.restore')}
        </Button>
      ) : (
        <Banner onDismiss={dismiss} dismissLabel={t('banner.dismiss')}>
          {t('banner.dismissibleText')}
        </Banner>
      )}
    </div>
  );
}

const getRowKey = (row: MaterialRow) => row.id;

function TableDemo({
  rows,
  caption,
}: {
  rows: MaterialRow[];
  caption: 'caption' | 'captionEmpty' | 'captionDesktop';
}) {
  const t = useTranslations('ShowcaseDataDisplay');
  const columns: DataTableColumn<MaterialRow>[] = [
    { key: 'id', header: t('table.position'), cell: (row) => row.id },
    {
      key: 'name',
      header: t('table.name'),
      cell: (row) => t(`table.names.${row.name}`),
      rowHeader: true,
    },
    { key: 'unit', header: t('table.unit'), cell: () => t('table.perSquare') },
    {
      key: 'price',
      header: t('table.price'),
      cell: (row) => row.price,
      numeric: true,
    },
  ];

  return (
    <DataTable
      caption={t(`table.${caption}`)}
      columns={columns}
      rows={rows}
      getRowKey={getRowKey}
      empty={
        <EmptyState
          icon="info"
          title={t('table.emptyTitle')}
          text={t('table.emptyText')}
        />
      }
    />
  );
}

function EmptyDemo() {
  const t = useTranslations('ShowcaseDataDisplay');

  return (
    <div className={styles.stack}>
      <EmptyState
        icon="plus"
        title={t('empty.title')}
        text={t('empty.text')}
        action={<Button kind="fill">{t('empty.action')}</Button>}
      />
      <EmptyState title={t('empty.plainTitle')} />
    </div>
  );
}

export function DataDisplaySection() {
  const t = useTranslations('ShowcaseDataDisplay');

  return (
    <>
      <h3 className={styles.title}>{t('skeletonTitle')}</h3>
      <p>{t('skeletonNote')}</p>
      <div aria-busy="true" className={styles.stack}>
        <SkeletonCard />
      </div>

      <h3 className={styles.title}>{t('progressTitle')}</h3>
      <div className={styles.stack}>
        <Progress
          label={t('progress.determinate')}
          caption={t('progress.determinate')}
          value={40}
          valueText={t('progress.valueText')}
        />
        <Progress
          label={t('progress.complete')}
          caption={t('progress.complete')}
          value={100}
        />
        <Progress
          label={t('progress.indeterminate')}
          caption={t('progress.indeterminate')}
        />
      </div>

      <h3 className={styles.title}>{t('emptyTitle')}</h3>
      <h4 className={styles.title}>{t('mobile')}</h4>
      <EmptyDemo />
      <h4 className={styles.title}>{t('desktop')}</h4>
      <DesktopFrame label={t('emptyTitle')}>
        <EmptyDemo />
      </DesktopFrame>

      <h3 className={styles.title}>{t('bannerTitle')}</h3>
      <h4 className={styles.title}>{t('mobile')}</h4>
      <BannerList />
      <h4 className={styles.title}>{t('desktop')}</h4>
      <DesktopFrame label={t('bannerTitle')}>
        <BannerList />
      </DesktopFrame>

      <h3 className={styles.title}>{t('imageTitle')}</h3>
      <p>{t('imageNote')}</p>
      <div className={styles.images}>
        <figure className={styles.figure}>
          <ImageWithFallback src={SAMPLE_IMAGE} name={t('image.loaded')} />
          <figcaption>{t('image.loadedCaption')}</figcaption>
        </figure>
        <figure className={styles.figure}>
          <ImageWithFallback src={BROKEN_IMAGE} name={t('image.broken')} />
          <figcaption>{t('image.brokenCaption')}</figcaption>
        </figure>
        <figure className={styles.figure}>
          <ImageWithFallback name={t('image.missing')} ratio="4 / 3" />
          <figcaption>{t('image.missingCaption')}</figcaption>
        </figure>
      </div>

      <h3 className={styles.title}>{t('tableTitle')}</h3>
      <h4 className={styles.title}>{t('mobile')}</h4>
      <TableDemo rows={ROWS} caption="caption" />
      <h4 className={styles.title}>{t('desktop')}</h4>
      <DesktopFrame label={t('tableTitle')}>
        <TableDemo rows={ROWS} caption="captionDesktop" />
      </DesktopFrame>
      <h4 className={styles.title}>{t('tableEmpty')}</h4>
      <TableDemo rows={[]} caption="captionEmpty" />
    </>
  );
}
