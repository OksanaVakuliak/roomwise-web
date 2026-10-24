import { useTranslations } from 'next-intl';
import { Icon, iconNames } from '@/components/ui';
import { ThemePanels } from './ThemePanels';
import styles from './tokens.module.css';

export function IconsSection() {
  const t = useTranslations('ShowcaseTokens');

  return (
    <ThemePanels>
      {() => (
        <>
          <p className={styles.value}>{t('icons.sizes')}</p>
          <ul className={`${styles.list} ${styles.iconList}`}>
            {iconNames.map((name) => (
              <li key={name} className={`${styles.item} ${styles.iconItem}`}>
                <span className={styles.iconSizes}>
                  <Icon name={name} size="sm" />
                  <Icon name={name} size="md" />
                  <Icon name={name} size="lg" />
                </span>
                <span className={styles.name}>{name}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </ThemePanels>
  );
}
