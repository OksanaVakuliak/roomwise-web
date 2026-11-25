import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { THEMES, type Theme } from '@/lib/contrast/contrast';
import { themeStyle } from './token-data';
import styles from './tokens.module.css';

type ThemePanelsProps = {
  children: (theme: Theme) => ReactNode;
};

export function ThemePanels({ children }: ThemePanelsProps) {
  const t = useTranslations('ShowcaseTokens');

  return (
    <div className={styles.panels}>
      {THEMES.map((theme) => (
        <div key={theme} className={styles.panel} style={themeStyle(theme)}>
          <h3 className={styles.panelTitle}>{t(`themes.${theme}`)}</h3>
          {children(theme)}
        </div>
      ))}
    </div>
  );
}
