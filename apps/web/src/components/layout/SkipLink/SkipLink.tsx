import { useTranslations } from 'next-intl';
import { MAIN_ID } from './main-id';
import styles from './SkipLink.module.css';

export function SkipLink() {
  const t = useTranslations('Layout');

  return (
    <a href={`#${MAIN_ID}`} className={styles.root}>
      {t('skipLink')}
    </a>
  );
}
