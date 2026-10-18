import { useTranslations } from 'next-intl';
import styles from './AppFooter.module.css';

export function AppFooter() {
  const t = useTranslations('Layout');

  return (
    <footer className={styles.root}>
      <p className={styles.brand}>{t('footerBrand')}</p>
      <p className={styles.note}>{t('footer')}</p>
    </footer>
  );
}
