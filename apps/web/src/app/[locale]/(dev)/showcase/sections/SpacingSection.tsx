import { useTranslations } from 'next-intl';
import type { CSSProperties } from 'react';
import { ThemePanels } from './ThemePanels';
import { DURATIONS, EASINGS, SPACING, STROKES } from './token-data';
import styles from './tokens.module.css';

export function SpacingSection() {
  const t = useTranslations('ShowcaseTokens');
  const stack = `${styles.list} ${styles.stack}`;

  return (
    <ThemePanels>
      {() => (
        <>
          <h4 className={styles.subTitle}>{t('spacing.title')}</h4>
          <ul className={stack}>
            {SPACING.map(({ name, value }) => (
              <li key={name} className={styles.item}>
                <span className={styles.name}>
                  {name} · {value}
                </span>
                <span
                  className={styles.bar}
                  style={{ '--size': `var(${name})` } as CSSProperties}
                  aria-hidden="true"
                />
              </li>
            ))}
          </ul>
          <h4 className={styles.subTitle}>{t('strokes.title')}</h4>
          <ul className={stack}>
            {STROKES.map(({ name, value }) => (
              <li key={name} className={styles.item}>
                <span className={styles.name}>
                  {name} · {value}
                </span>
                <span
                  className={styles.strokeBar}
                  style={{ '--size': `var(${name})` } as CSSProperties}
                  aria-hidden="true"
                />
              </li>
            ))}
          </ul>
          <h4 className={styles.subTitle}>{t('motion.title')}</h4>
          <ul className={stack}>
            {DURATIONS.map(({ name, value }) => (
              <li key={name} className={styles.item}>
                <span className={styles.name}>
                  {name} · {value}
                </span>
                <span className={styles.motionTrack} aria-hidden="true">
                  <span
                    className={styles.motionDot}
                    style={
                      {
                        '--duration': `calc(var(${name}) * 4)`,
                      } as CSSProperties
                    }
                  />
                </span>
              </li>
            ))}
          </ul>
          <h4 className={styles.subTitle}>{t('motion.easing')}</h4>
          <ul className={stack}>
            {EASINGS.map(({ name, value }) => (
              <li key={name} className={styles.item}>
                <span className={styles.name}>{name}</span>
                <span className={styles.value}>{value}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </ThemePanels>
  );
}
