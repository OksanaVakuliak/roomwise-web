import { useTranslations } from 'next-intl';
import styles from './SkipLink.module.css';

export function SkipLink() {
  const t = useTranslations('Layout');

  return (
    <a href="#main" className={styles.root}>
      {t('skipLink')}
    </a>
  );
}
