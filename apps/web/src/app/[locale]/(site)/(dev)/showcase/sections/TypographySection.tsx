import { useTranslations } from 'next-intl';
import { ThemePanels } from './ThemePanels';
import { TYPE_STYLES } from './token-data';
import styles from './tokens.module.css';

export function TypographySection() {
  const t = useTranslations('ShowcaseTokens');

  return (
    <ThemePanels>
      {() => (
        <ul className={`${styles.list} ${styles.stack}`}>
          {TYPE_STYLES.map(({ name, className, size }) => (
            <li key={name} className={styles.typeRow}>
              <span className={styles.typeMeta}>
                {name} · {size}
              </span>
              <span className={className}>{t('typography.sample')}</span>
            </li>
          ))}
        </ul>
      )}
    </ThemePanels>
  );
}
