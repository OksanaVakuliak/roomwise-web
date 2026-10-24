import { useTranslations } from 'next-intl';
import { Brand } from '@/components/ui';
import { Link } from '@/i18n/navigation';
import { PreferenceSwitches } from '../PreferenceSwitches/PreferenceSwitches';
import styles from './AppHeader.module.css';

export function AppHeader() {
  const t = useTranslations('Layout');

  return (
    <header className={styles.root}>
      <Link href="/" className={styles.brand} aria-label={t('brandLink')}>
        <Brand name={t('brandName')} caption={t('brandCaption')} />
      </Link>
      <div className={styles.prefs}>
        <PreferenceSwitches />
      </div>
    </header>
  );
}
