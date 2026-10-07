'use client';

import { useLocale, useTranslations } from 'next-intl';
import { type ChangeEvent, useCallback, useId } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { currencies } from '@/lib/format';
import { THEME_MODES } from '@/lib/theme';
import { usePreferences } from '@/stores/preferences';
import { usePreferencesHydration } from '@/stores/use-preferences-hydration';
import styles from './showcase.module.css';

export function ShowcaseToolbar() {
  const t = useTranslations('Showcase');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const id = useId();

  usePreferencesHydration();

  const currency = usePreferences((state) => state.currency);
  const theme = usePreferences((state) => state.theme);
  const setLocale = usePreferences((state) => state.setLocale);
  const setCurrency = usePreferences((state) => state.setCurrency);
  const setTheme = usePreferences((state) => state.setTheme);

  const changeLocale = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const next = routing.locales.find((item) => item === event.target.value);
      if (next) {
        setLocale(next);
        router.replace(pathname, { locale: next });
      }
    },
    [pathname, router, setLocale],
  );

  const changeCurrency = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const next = currencies.find((item) => item === event.target.value);
      if (next) {
        setCurrency(next);
      }
    },
    [setCurrency],
  );

  const changeTheme = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const next = THEME_MODES.find((item) => item === event.target.value);
      if (next) {
        setTheme(next);
      }
    },
    [setTheme],
  );

  return (
    <div className={styles.toolbar}>
      <div className={styles.field}>
        <label htmlFor={`${id}-locale`}>{t('toolbar.language')}</label>
        <select
          id={`${id}-locale`}
          className={styles.select}
          value={locale}
          onChange={changeLocale}
        >
          {routing.locales.map((item) => (
            <option key={item} value={item}>
              {t(`toolbar.locales.${item}`)}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.field}>
        <label htmlFor={`${id}-currency`}>{t('toolbar.currency')}</label>
        <select
          id={`${id}-currency`}
          className={styles.select}
          value={currency}
          onChange={changeCurrency}
        >
          {currencies.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.field}>
        <label htmlFor={`${id}-theme`}>{t('toolbar.theme')}</label>
        <select
          id={`${id}-theme`}
          className={styles.select}
          value={theme}
          onChange={changeTheme}
        >
          {THEME_MODES.map((item) => (
            <option key={item} value={item}>
              {t(`toolbar.themes.${item}`)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
