import { useTranslations } from 'next-intl';
import { ZoneEmpty, ZoneSkeleton } from '@/components/system';
import { Button } from '@/components/ui';
import styles from './SystemStatesSection.module.css';

const KINDS = ['showcase', 'rooms', 'specification', 'estimate'] as const;
const LOADING_KINDS = [
  ...KINDS,
  'interior',
  'engineering',
  'style',
  'result',
  'object',
  'plan',
  'picker',
  'scene',
  'nav',
] as const;

export function SystemStatesSection() {
  const t = useTranslations('ShowcaseSystemStates');
  const tLoading = useTranslations('ZoneStates.loading');

  return (
    <div className={styles.stack}>
      <h3 className={styles.heading}>{t('loadingTitle')}</h3>
      <div className={styles.grid}>
        {LOADING_KINDS.map((kind) => (
          <div key={kind} className={styles.cell}>
            <p className={styles.caption}>{tLoading(kind)}</p>
            <ZoneSkeleton kind={kind} />
          </div>
        ))}
      </div>

      <h3 className={styles.heading}>{t('emptyTitle')}</h3>
      <div className={styles.grid}>
        {KINDS.map((kind) => (
          <div key={kind} className={styles.cell}>
            <p className={styles.caption}>{t(kind)}</p>
            <ZoneEmpty
              kind={kind}
              headingLevel={4}
              action={<Button kind="fill">{t('action')}</Button>}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
