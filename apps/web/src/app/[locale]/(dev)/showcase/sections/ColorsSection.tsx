import { useMessages, useTranslations } from 'next-intl';
import { measure, PAIRS, verdict } from '@/lib/contrast/contrast';
import { ThemePanels } from './ThemePanels';
import { themeColors, themeRoles } from './token-data';
import styles from './tokens.module.css';

export function ColorsSection() {
  const t = useTranslations('ShowcaseTokens');
  const roleNames: Record<string, string> =
    useMessages().ShowcaseTokens.colors.roles;

  return (
    <ThemePanels>
      {(theme) => {
        const roles = themeRoles(theme);
        return (
          <>
            <h4 className={styles.subTitle}>{t('colors.palette')}</h4>
            <ul className={styles.list}>
              {themeColors(theme).map(({ name, value }) => (
                <li key={name} className={styles.item}>
                  <span
                    className={styles.swatch}
                    style={{ background: `var(--${name})` }}
                    aria-hidden="true"
                  />
                  <span className={styles.name}>--{name}</span>
                  <span className={styles.value}>{value}</span>
                  <span className={styles.role}>{roleNames[name]}</span>
                </li>
              ))}
            </ul>
            <h4 className={styles.subTitle}>{t('colors.contrast')}</h4>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">{t('colors.pair')}</th>
                  <th scope="col">{t('colors.use')}</th>
                  <th scope="col">{t('colors.ratio')}</th>
                  <th scope="col">{t('colors.verdict')}</th>
                </tr>
              </thead>
              <tbody>
                {PAIRS.map((pair) => {
                  const ratio = measure(roles, pair);
                  return (
                    <tr key={`${pair.fg}-${pair.bg}-${pair.kind}`}>
                      <td>
                        <span
                          className={styles.sample}
                          style={{
                            color: `var(--${pair.fg})`,
                            background: `var(--${pair.bg})`,
                          }}
                        >
                          {pair.fg} / {pair.bg}
                        </span>
                      </td>
                      <td>{t(`colors.kinds.${pair.kind}`)}</td>
                      <td>{ratio.toFixed(2)}:1</td>
                      <td>{t(`colors.verdicts.${verdict(ratio)}`)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        );
      }}
    </ThemePanels>
  );
}
